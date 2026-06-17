export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus   = 'pending' | 'in_progress' | 'completed';

export interface Profile {
  id:           string;
  username:     string;
  display_name: string | null;
  avatar_url:   string | null;
  created_at:   string;
  updated_at:   string;
}

export interface Board {
  id:         string;
  user_id:    string;
  title:      string;
  color:      string;
  icon:       string;
  created_at: string;
  updated_at: string;
  // computed
  task_count?:      number;
  completed_count?: number;
}

export interface Task {
  id:           string;
  user_id:      string;
  board_id:     string | null;
  title:        string;
  description:  string | null;
  status:       TaskStatus;
  priority:     TaskPriority;
  due_date:     string | null;
  completed_at: string | null;
  created_at:   string;
  updated_at:   string;
  // offline
  _pendingSync?: boolean;
  _localId?:     string;
}

export interface OfflineQueue {
  id:        string;
  action:    'create' | 'update' | 'delete';
  table:     'tasks' | 'boards';
  payload:   Record<string, unknown>;
  timestamp: number;
}
