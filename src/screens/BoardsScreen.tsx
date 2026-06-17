import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Folder, Trash2, X, Check } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, SPACING, RADIUS, FONTS } from '../utils/theme';
import type { Board } from '../types';

const BOARD_COLORS: string[] = [
  '#4A90E2', '#27AE60', '#F39C12',
  '#8E44AD', '#E74C3C', '#1ABC9C',
  '#E91E8C', '#FF6B35',
];

export default function BoardsScreen() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const boards     = useAppStore((s) => s.boards);
  const tasks      = useAppStore((s) => s.tasks);
  const addBoard   = useAppStore((s) => s.addBoard);
  const deleteBoard = useAppStore((s) => s.deleteBoard);
  const profile    = useAppStore((s) => s.profile);
  const theme      = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const [modalVisible, setModalVisible] = useState(false);
  const [title,  setTitle]  = useState('');
  const [color,  setColor]  = useState(BOARD_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !profile) return;
    setSaving(true);
    await addBoard({ user_id: profile.id, title: title.trim(), color, icon: 'folder' });
    setSaving(false);
    setTitle('');
    setColor(BOARD_COLORS[0]);
    setModalVisible(false);
  };

  const handleDelete = (b: Board) => {
    Alert.alert('Delete Board', `Delete "${b.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBoard(b.id) },
    ]);
  };

  const taskCount = (boardId: string) => tasks.filter((t) => t.board_id === boardId).length;
  const doneCount = (boardId: string) => tasks.filter((t) => t.board_id === boardId && t.status === 'completed').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Boards</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.addGrad}>
            <Plus color="#fff" size={20} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={boards}
        keyExtractor={(b) => b.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const total = taskCount(item.id);
          const done  = doneCount(item.id);
          const pct   = total ? Math.round((done / total) * 100) : 0;
          return (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={styles.cardWrap}>
              <LinearGradient
                colors={[item.color, item.color + 'BB']}
                style={styles.card}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                {/* Deco circle */}
                <View style={styles.deco} />

                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <Trash2 size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

                <Folder size={28} color="rgba(255,255,255,0.9)" style={{ marginBottom: SPACING.sm }} />
                <Text style={styles.boardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.boardSub}>{total} tasks</Text>

                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressText}>{pct}% done</Text>
              </LinearGradient>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📂</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No boards yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>Create a board to organize your tasks</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.8}>
              <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.emptyBtn}>
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Create Board</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Board Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Board</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.textMuted} size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: theme.bgInput, color: theme.text, borderColor: theme.border }]}
              placeholder="Board name..."
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            <Text style={[styles.colorLabel, { color: theme.textSub }]}>Color</Text>
            <View style={styles.colorRow}>
              {BOARD_COLORS.map((c) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }]}>
                  {color === c && <Check size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleAdd} disabled={saving || !title.trim()} activeOpacity={0.8}>
              <LinearGradient
                colors={title.trim() ? [COLORS.blue, COLORS.purple] : ['#555', '#555']}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Creating...' : 'Create Board'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  title:   { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  addBtn:  { borderRadius: RADIUS.md, overflow: 'hidden' },
  addGrad: { padding: SPACING.sm, borderRadius: RADIUS.md },
  list:    { padding: SPACING.lg, paddingBottom: 100 },
  row:     { gap: SPACING.sm, marginBottom: SPACING.sm },
  cardWrap: { flex: 1 },
  card: {
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    minHeight: 160, overflow: 'hidden',
  },
  deco: {
    position: 'absolute', top: -20, right: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  deleteBtn: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, padding: 4 },
  boardTitle: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: 4 },
  boardSub:   { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.sm },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700' },
  emptyDesc:  { fontSize: FONTS.sizes.sm, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full, marginTop: SPACING.sm,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, gap: SPACING.md,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:  { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  input: {
    borderRadius: RADIUS.md, borderWidth: 1,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  colorLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  colorRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  colorDot: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtn: { borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
});
