import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trash2, Check, Calendar, Flag, Folder } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, SPACING, RADIUS, FONTS } from '../utils/theme';
import type { TaskPriority, TaskStatus } from '../types';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: COLORS.green, medium: COLORS.orange, high: COLORS.red,
};
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: COLORS.orange, in_progress: COLORS.blue, completed: COLORS.green,
};

export default function TaskDetailScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const tasks     = useAppStore((s) => s.tasks);
  const boards    = useAppStore((s) => s.boards);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const theme     = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const task = tasks.find((t) => t.id === id);
  const [editing, setEditing] = useState(false);
  const [title,   setTitle]   = useState(task?.title || '');
  const [desc,    setDesc]    = useState(task?.description || '');

  if (!task) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <Text style={{ color: theme.text, padding: SPACING.lg }}>Task not found</Text>
    </SafeAreaView>
  );

  const board = boards.find((b) => b.id === task.board_id);

  const handleSave = async () => {
    await updateTask(task.id, { title: title.trim(), description: desc.trim() || null });
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTask(task.id); router.back(); } },
    ]);
  };

  const cycleStatus = async () => {
    const next: Record<TaskStatus, TaskStatus> = {
      pending: 'in_progress', in_progress: 'completed', completed: 'pending',
    };
    if (task.status === 'in_progress') {
      await completeTask(task.id);
    } else {
      await updateTask(task.id, { status: next[task.status] });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={theme.text} size={22} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {editing ? (
            <TouchableOpacity onPress={handleSave}>
              <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)} style={[styles.editBtn, { backgroundColor: theme.bgCard }]}>
              <Text style={[styles.editBtnText, { color: COLORS.blue }]}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: COLORS.red + '22' }]}>
            <Trash2 size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <TouchableOpacity onPress={cycleStatus} style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[task.status] + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[task.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[task.status] }]}>
            {task.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
          <Text style={[styles.statusHint, { color: STATUS_COLORS[task.status] }]}>tap to change</Text>
        </TouchableOpacity>

        {/* Title */}
        {editing ? (
          <TextInput
            style={[styles.titleInput, { color: theme.text, borderBottomColor: COLORS.blue }]}
            value={title}
            onChangeText={setTitle}
            multiline
            autoFocus
          />
        ) : (
          <Text style={[styles.titleText, { color: theme.text },
            task.status === 'completed' && { textDecorationLine: 'line-through', color: theme.textMuted }
          ]}>
            {task.title}
          </Text>
        )}

        {/* Description */}
        <View style={[styles.card, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.cardLabel, { color: theme.textMuted }]}>Description</Text>
          {editing ? (
            <TextInput
              style={[styles.descInput, { color: theme.text }]}
              value={desc}
              onChangeText={setDesc}
              multiline
              placeholder="Add description..."
              placeholderTextColor={theme.textMuted}
            />
          ) : (
            <Text style={[styles.descText, { color: task.description ? theme.textSub : theme.textMuted }]}>
              {task.description || 'No description'}
            </Text>
          )}
        </View>

        {/* Meta */}
        <View style={[styles.card, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.cardLabel, { color: theme.textMuted }]}>Details</Text>

          <View style={styles.metaRow}>
            <Flag size={16} color={PRIORITY_COLORS[task.priority]} />
            <Text style={[styles.metaLabel, { color: theme.textSub }]}>Priority</Text>
            <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[task.priority] + '22' }]}>
              <Text style={[styles.badgeText, { color: PRIORITY_COLORS[task.priority] }]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
          </View>

          {task.due_date && (
            <View style={styles.metaRow}>
              <Calendar size={16} color={theme.textSub} />
              <Text style={[styles.metaLabel, { color: theme.textSub }]}>Due Date</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          )}

          {board && (
            <View style={styles.metaRow}>
              <Folder size={16} color={board.color} />
              <Text style={[styles.metaLabel, { color: theme.textSub }]}>Board</Text>
              <View style={[styles.badge, { backgroundColor: board.color + '22' }]}>
                <Text style={[styles.badgeText, { color: board.color }]}>{board.title}</Text>
              </View>
            </View>
          )}

          <View style={styles.metaRow}>
            <Calendar size={16} color={theme.textMuted} />
            <Text style={[styles.metaLabel, { color: theme.textSub }]}>Created</Text>
            <Text style={[styles.metaValue, { color: theme.textSub }]}>
              {new Date(task.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Complete button */}
        {task.status !== 'completed' && (
          <TouchableOpacity onPress={() => completeTask(task.id)} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.green, '#1E8449']} style={styles.completeBtn}>
              <Check size={20} color="#fff" />
              <Text style={styles.completeBtnText}>Mark as Complete</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn:       { padding: SPACING.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  saveBtn:       { paddingVertical: 8, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.full },
  saveBtnText:   { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  editBtn:       { paddingVertical: 8, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.full },
  editBtnText:   { fontWeight: '700', fontSize: FONTS.sizes.sm },
  deleteBtn:     { padding: SPACING.sm, borderRadius: RADIUS.md },
  scroll:        { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 100 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  statusHint: { fontSize: FONTS.sizes.xs, opacity: 0.7 },
  titleText: {
    fontSize: FONTS.sizes.xxl, fontWeight: '800',
    lineHeight: 32, marginVertical: SPACING.sm,
  },
  titleInput: {
    fontSize: FONTS.sizes.xxl, fontWeight: '800',
    lineHeight: 32, borderBottomWidth: 2, paddingBottom: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  card:       { borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.md },
  cardLabel:  { fontSize: FONTS.sizes.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  descText:   { fontSize: FONTS.sizes.md, lineHeight: 22 },
  descInput:  { fontSize: FONTS.sizes.md, lineHeight: 22, minHeight: 60 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  metaLabel:  { flex: 1, fontSize: FONTS.sizes.sm },
  metaValue:  { fontSize: FONTS.sizes.sm },
  badge: {
    paddingVertical: 4, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  badgeText:    { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl, marginTop: SPACING.sm,
  },
  completeBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
