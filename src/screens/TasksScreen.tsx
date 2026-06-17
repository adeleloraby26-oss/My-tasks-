import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Search, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import TaskCard from '../components/TaskCard';
import { useAppStore } from '../store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, SPACING, RADIUS, FONTS } from '../utils/theme';
import type { TaskStatus } from '../types';

const FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All',          value: 'all'        },
  { label: 'Pending',      value: 'pending'    },
  { label: 'In Progress',  value: 'in_progress'},
  { label: 'Completed',    value: 'completed'  },
];

const FILTER_COLORS: Record<string, string> = {
  all:         COLORS.blue,
  pending:     COLORS.orange,
  in_progress: COLORS.purple,
  completed:   COLORS.green,
};

export default function TasksScreen() {
  const router      = useRouter();
  const isDarkMode  = useAppStore((s) => s.isDarkMode);
  const tasks       = useAppStore((s) => s.tasks);
  const completeTask = useAppStore((s) => s.completeTask);
  const deleteTask  = useAppStore((s) => s.deleteTask);
  const theme       = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter !== 'all') list = list.filter((t) => t.status === filter);
    if (search) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [tasks, filter, search]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Tasks</Text>
        <TouchableOpacity onPress={() => router.push('/tasks/new')} style={styles.addBtn}>
          <Plus color={COLORS.blue} size={24} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: theme.bgInput }]}>
        <Search size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search tasks..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                styles.filterBtn,
                { backgroundColor: active ? FILTER_COLORS[f.value] : theme.bgCard },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? '#fff' : theme.textSub }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <TaskCard
              task={item}
              theme={theme}
              onComplete={completeTask}
              onDelete={deleteTask}
              onPress={(t) => router.push(`/tasks/${t.id}`)}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>
              {filter === 'completed' ? '🎉' : '📋'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
  },
  title:  { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  addBtn: { padding: SPACING.xs },
  searchBox: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.sm,
    marginHorizontal: SPACING.lg,
    paddingVertical:  SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius:   RADIUS.full,
    marginBottom:   SPACING.md,
  },
  searchInput: { flex: 1, fontSize: FONTS.sizes.md },
  filterRow: {
    flexDirection:   'row',
    gap:             SPACING.xs,
    paddingHorizontal: SPACING.lg,
    marginBottom:    SPACING.md,
    flexWrap:        'wrap',
  },
  filterBtn: {
    paddingVertical:   6,
    paddingHorizontal: SPACING.md,
    borderRadius:   RADIUS.full,
  },
  filterText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  list:  { paddingBottom: 100 },
  empty: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl * 2,
    gap:        SPACING.md,
  },
  emptyText: { fontSize: FONTS.sizes.md },
});
