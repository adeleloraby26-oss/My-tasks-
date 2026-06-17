import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import type { Task, Board, Profile, OfflineQueue } from '../types';

const STORAGE_KEYS = {
  tasks:   'mytasks:tasks',
  boards:  'mytasks:boards',
  queue:   'mytasks:offline_queue',
  profile: 'mytasks:profile',
  theme:   'mytasks:theme',
};

interface AppState {
  profile:      Profile | null;
  isAuthLoaded: boolean;
  setProfile:   (p: Profile | null) => void;

  tasks:    Task[];
  boards:   Board[];
  isOnline: boolean;

  isDarkMode: boolean;
  toggleTheme: () => void;

  loadLocal:      () => Promise<void>;
  syncFromServer: () => Promise<void>;
  addTask:        (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask:     (id: string, changes: Partial<Task>) => Promise<void>;
  deleteTask:     (id: string) => Promise<void>;
  completeTask:   (id: string) => Promise<void>;
  addBoard:       (board: Omit<Board, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteBoard:    (id: string) => Promise<void>;
  setOnline:      (v: boolean) => void;
  flushQueue:     () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile:      null,
  isAuthLoaded: false,
  tasks:        [],
  boards:       [],
  isOnline:     true,
  isDarkMode:   true,

  setProfile: (p) => {
    set({ profile: p, isAuthLoaded: true });
    if (p) AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(p));
    else    AsyncStorage.removeItem(STORAGE_KEYS.profile);
  },

  toggleTheme: () =>
    set((s) => {
      const next = !s.isDarkMode;
      AsyncStorage.setItem(STORAGE_KEYS.theme, next ? 'dark' : 'light');
      return { isDarkMode: next };
    }),

  loadLocal: async () => {
    try {
      const [rawTasks, rawBoards, rawProfile, rawTheme] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.tasks),
        AsyncStorage.getItem(STORAGE_KEYS.boards),
        AsyncStorage.getItem(STORAGE_KEYS.profile),
        AsyncStorage.getItem(STORAGE_KEYS.theme),
      ]);
      set({
        tasks:      rawTasks   ? JSON.parse(rawTasks)   : [],
        boards:     rawBoards  ? JSON.parse(rawBoards)  : [],
        profile:    rawProfile ? JSON.parse(rawProfile) : null,
        isDarkMode: rawTheme   ? rawTheme === 'dark'    : true,
        isAuthLoaded: true,
      });
    } catch (e) {
      console.error('loadLocal error', e);
      set({ isAuthLoaded: true });
    }
  },

  syncFromServer: async () => {
    const { profile } = get();
    if (!profile) return;
    try {
      const [{ data: tasks }, { data: boards }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('boards').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      ]);
      if (tasks)  { set({ tasks  }); AsyncStorage.setItem(STORAGE_KEYS.tasks,  JSON.stringify(tasks));  }
      if (boards) { set({ boards }); AsyncStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards)); }
    } catch (e) {
      console.error('syncFromServer error', e);
    }
  },

  addTask: async (taskData) => {
    const { profile, isOnline } = get();
    if (!profile) return;

    const tempId = `local_${Date.now()}`;
    const now    = new Date().toISOString();
    const optimistic: Task = {
      ...taskData,
      id:          tempId,
      created_at:  now,
      updated_at:  now,
      _pendingSync: !isOnline,
    } as Task;

    set((s) => {
      const tasks = [optimistic, ...s.tasks];
      AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
      return { tasks };
    });

    if (isOnline) {
      const { data, error } = await supabase.from('tasks').insert({
        user_id:     profile.id,
        board_id:    taskData.board_id,
        title:       taskData.title,
        description: taskData.description,
        status:      taskData.status,
        priority:    taskData.priority,
        due_date:    taskData.due_date,
      }).select().single();

      if (data && !error) {
        set((s) => {
          const tasks = s.tasks.map((t) => t.id === tempId ? data : t);
          AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
          return { tasks };
        });
      } else {
        // فشل الـ insert — شيل الـ optimistic وبلغ
        set((s) => {
          const tasks = s.tasks.filter((t) => t.id !== tempId);
          AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
          return { tasks };
        });
        console.error('addTask error', error);
      }
    } else {
      enqueueOffline('create', 'tasks', { ...taskData, user_id: profile.id, _localId: tempId });
    }
  },

  updateTask: async (id, changes) => {
    const { isOnline } = get();
    set((s) => {
      const tasks = s.tasks.map((t) => t.id === id ? { ...t, ...changes, updated_at: new Date().toISOString() } : t);
      AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
      return { tasks };
    });
    if (isOnline) {
      await supabase.from('tasks').update(changes).eq('id', id);
    } else {
      enqueueOffline('update', 'tasks', { id, ...changes });
    }
  },

  deleteTask: async (id) => {
    const { isOnline } = get();
    set((s) => {
      const tasks = s.tasks.filter((t) => t.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
      return { tasks };
    });
    if (isOnline) {
      await supabase.from('tasks').delete().eq('id', id);
    } else {
      enqueueOffline('delete', 'tasks', { id });
    }
  },

  completeTask: async (id) => {
    const { updateTask } = get();
    await updateTask(id, { status: 'completed', completed_at: new Date().toISOString() });
  },

  addBoard: async (boardData) => {
    const { profile, isOnline } = get();
    if (!profile) return;

    const tempId = `local_${Date.now()}`;
    const now    = new Date().toISOString();
    const optimistic: Board = {
      ...boardData,
      user_id:    profile.id,
      id:         tempId,
      created_at: now,
      updated_at: now,
    } as Board;

    // أضفه فوراً للـ UI
    set((s) => {
      const boards = [optimistic, ...s.boards];
      AsyncStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards));
      return { boards };
    });

    if (isOnline) {
      const { data, error } = await supabase.from('boards').insert({
        user_id: profile.id,
        title:   boardData.title,
        color:   boardData.color,
        icon:    boardData.icon,
      }).select().single();

      if (data && !error) {
        // استبدل الـ temp بالـ real data
        set((s) => {
          const boards = s.boards.map((b) => b.id === tempId ? data : b);
          AsyncStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards));
          return { boards };
        });
      } else {
        // فشل — شيل الـ optimistic وبلغ
        set((s) => {
          const boards = s.boards.filter((b) => b.id !== tempId);
          AsyncStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards));
          return { boards };
        });
        console.error('addBoard error', error);
      }
    } else {
      enqueueOffline('create', 'boards', {
        user_id: profile.id,
        title:   boardData.title,
        color:   boardData.color,
        icon:    boardData.icon,
        _localId: tempId,
      });
    }
  },

  deleteBoard: async (id) => {
    const { isOnline } = get();
    set((s) => {
      const boards = s.boards.filter((b) => b.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards));
      return { boards };
    });
    if (isOnline) {
      await supabase.from('boards').delete().eq('id', id);
    } else {
      enqueueOffline('delete', 'boards', { id });
    }
  },

  setOnline: (v) => set({ isOnline: v }),

  flushQueue: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.queue);
      if (!raw) return;
      const queue: OfflineQueue[] = JSON.parse(raw);
      const remaining: OfflineQueue[] = [];

      for (const item of queue) {
        try {
          if (item.action === 'create') {
            const { _localId, ...payload } = item.payload as { _localId?: string; [k: string]: unknown };
            await supabase.from(item.table).insert(payload);
          } else if (item.action === 'update') {
            const { id, ...payload } = item.payload as { id: string; [k: string]: unknown };
            await supabase.from(item.table).update(payload).eq('id', id);
          } else if (item.action === 'delete') {
            await supabase.from(item.table).delete().eq('id', (item.payload as { id: string }).id);
          }
        } catch {
          remaining.push(item);
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(remaining));
      if (remaining.length === 0) await get().syncFromServer();
    } catch (e) {
      console.error('flushQueue error', e);
    }
  },
}));

async function enqueueOffline(
  action: OfflineQueue['action'],
  table:  OfflineQueue['table'],
  payload: Record<string, unknown>,
) {
  try {
    const raw  = await AsyncStorage.getItem('mytasks:offline_queue');
    const queue: OfflineQueue[] = raw ? JSON.parse(raw) : [];
    queue.push({ id: `q_${Date.now()}`, action, table, payload, timestamp: Date.now() });
    await AsyncStorage.setItem('mytasks:offline_queue', JSON.stringify(queue));
  } catch (e) {
    console.error('enqueueOffline error', e);
  }
}
