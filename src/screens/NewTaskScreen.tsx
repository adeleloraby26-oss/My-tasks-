import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Calendar, Flag, Folder } from 'lucide-react-native';
import DateTimePickerModal from '@react-native-community/datetimepicker';
import { useAppStore } from '../store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, SPACING, RADIUS, FONTS } from '../utils/theme';
import type { TaskPriority } from '../types';

const PRIORITIES: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Low',    value: 'low',    color: COLORS.green  },
  { label: 'Medium', value: 'medium', color: COLORS.orange },
  { label: 'High',   value: 'high',   color: COLORS.red    },
];

export default function NewTaskScreen() {
  const router    = useRouter();
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const boards    = useAppStore((s) => s.boards);
  const profile   = useAppStore((s) => s.profile);
  const addTask   = useAppStore((s) => s.addTask);
  const theme     = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [boardId,  setBoardId]  = useState<string | null>(null);
  const [dueDate,  setDueDate]  = useState<Date | null>(null);
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Task title is required'); return; }
    if (!profile)       { Alert.alert('Error', 'Please log in first'); return; }
    setSaving(true);
    try {
      await addTask({
        user_id:     profile.id,
        board_id:    boardId,
        title:       title.trim(),
        description: desc.trim() || null,
        status:      'pending',
        priority,
        due_date:    dueDate ? dueDate.toISOString() : null,
        completed_at: null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X color={theme.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>New Task</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <TextInput
            style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
            placeholder="Task title..."
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
            multiline
            autoFocus
          />

          {/* Description */}
          <TextInput
            style={[styles.descInput, { color: theme.textSub, backgroundColor: theme.bgCard }]}
            placeholder="Add description (optional)..."
            placeholderTextColor={theme.textMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={3}
          />

          {/* Priority */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Flag size={16} color={theme.textSub} />
              <Text style={[styles.sectionLabel, { color: theme.textSub }]}>Priority</Text>
            </View>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[
                    styles.priorityBtn,
                    { borderColor: p.color, backgroundColor: priority === p.value ? p.color : 'transparent' },
                  ]}
                >
                  <Text style={[styles.priorityText, { color: priority === p.value ? '#fff' : p.color }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due date */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={16} color={theme.textSub} />
              <Text style={[styles.sectionLabel, { color: theme.textSub }]}>Due Date</Text>
            </View>
            <View style={styles.dateRow}>
              {[null, 'today', 'tomorrow', 'next_week'].map((d) => {
                const date = d === null ? null
                  : d === 'today'    ? new Date()
                  : d === 'tomorrow' ? new Date(Date.now() + 86400000)
                  : new Date(Date.now() + 7 * 86400000);
                const label = d === null ? 'None' : d === 'today' ? 'Today' : d === 'tomorrow' ? 'Tomorrow' : 'Next week';
                const isSelected = d === null ? dueDate === null : dueDate?.toDateString() === date?.toDateString();
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setDueDate(date)}
                    style={[
                      styles.dateBtn,
                      { backgroundColor: isSelected ? COLORS.blue : theme.bgCard },
                    ]}
                  >
                    <Text style={[styles.dateBtnText, { color: isSelected ? '#fff' : theme.textSub }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Board */}
          {boards.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Folder size={16} color={theme.textSub} />
                <Text style={[styles.sectionLabel, { color: theme.textSub }]}>Board</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boardScroll}>
                <TouchableOpacity
                  onPress={() => setBoardId(null)}
                  style={[styles.boardChip, { backgroundColor: boardId === null ? COLORS.blue : theme.bgCard }]}
                >
                  <Text style={[styles.boardChipText, { color: boardId === null ? '#fff' : theme.textSub }]}>
                    None
                  </Text>
                </TouchableOpacity>
                {boards.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setBoardId(b.id)}
                    style={[styles.boardChip, { backgroundColor: boardId === b.id ? b.color : theme.bgCard }]}
                  >
                    <Text style={[styles.boardChipText, { color: boardId === b.id ? '#fff' : theme.textSub }]}>
                      {b.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  saveBtn:     { paddingVertical: 8, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.full },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  scroll: { padding: SPACING.lg, gap: SPACING.lg },
  titleInput: {
    fontSize:     FONTS.sizes.xxl,
    fontWeight:   '700',
    borderBottomWidth: 1,
    paddingBottom: SPACING.md,
    marginBottom:  SPACING.sm,
  },
  descInput: {
    borderRadius:  RADIUS.lg,
    padding:       SPACING.md,
    fontSize:      FONTS.sizes.md,
    minHeight:     80,
    textAlignVertical: 'top',
  },
  section:      { gap: SPACING.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  sectionLabel:  { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  priorityRow:   { flexDirection: 'row', gap: SPACING.sm },
  priorityBtn: {
    flex:            1,
    paddingVertical: SPACING.sm,
    alignItems:      'center',
    borderRadius:    RADIUS.md,
    borderWidth:     1.5,
  },
  priorityText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  dateBtn: {
    paddingVertical:   8,
    paddingHorizontal: SPACING.md,
    borderRadius:      RADIUS.full,
  },
  dateBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '500' },
  boardScroll: { marginTop: SPACING.xs },
  boardChip: {
    paddingVertical:   8,
    paddingHorizontal: SPACING.md,
    borderRadius:      RADIUS.full,
    marginRight:       SPACING.xs,
  },
  boardChipText: { fontSize: FONTS.sizes.sm, fontWeight: '500' },
});
