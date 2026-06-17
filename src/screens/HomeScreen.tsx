import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Folder, CheckCircle2, Clock, TrendingUp, Plus, Zap, BarChart2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import StatCard from '../components/StatCard';
import { useAppStore } from '../store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, SPACING, RADIUS, FONTS } from '../utils/theme';

export default function HomeScreen() {
  const router     = useRouter();
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const profile    = useAppStore((s) => s.profile);
  const tasks      = useAppStore((s) => s.tasks);
  const boards     = useAppStore((s) => s.boards);
  const sync       = useAppStore((s) => s.syncFromServer);
  const [refreshing, setRefreshing] = React.useState(false);
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const stats = useMemo(() => {
    const total     = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending   = tasks.filter((t) => t.status === 'pending').length;
    const rate      = total ? Math.round((completed / total) * 100) : 0;
    const overdue   = tasks.filter(
      (t) => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()
    ).length;
    return { total, completed, pending, rate, overdue, boards: boards.length };
  }, [tasks, boards]);

  const recentTasks = tasks.slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <LinearGradient colors={['#000000', theme.bg]} style={styles.headerGrad} />
          <View style={styles.headerInner}>
            <View>
              <Text style={[styles.greet, { color: theme.textSub }]}>
                {greeting()}, {profile?.display_name || profile?.username}! 👋
              </Text>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Ready to get things done?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/tasks/new')}
              style={styles.addBtn}
            >
              <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.addGrad}>
                <Plus color="#fff" size={22} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick nav */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.quickNav}>
          <TouchableOpacity onPress={() => router.push('/boards')} style={[styles.quickBtn, { backgroundColor: theme.bgCard }]}>
            <Folder size={18} color={COLORS.blue} />
            <Text style={[styles.quickText, { color: theme.text }]}>View Boards</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/analytics')} style={[styles.quickBtn, { backgroundColor: theme.bgCard }]}>
            <BarChart2 size={18} color={COLORS.purple} />
            <Text style={[styles.quickText, { color: theme.text }]}>Analytics</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stat cards grid */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Boards" value={stats.boards}
              colors={[COLORS.blue, '#357ABD']}
              icon={<Folder size={14} color="rgba(255,255,255,0.8)" />}
              delay={0}
            />
            <StatCard
              label="Completed" value={stats.completed}
              colors={[COLORS.green, '#1E8449']}
              icon={<CheckCircle2 size={14} color="rgba(255,255,255,0.8)" />}
              delay={60}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Pending" value={stats.pending}
              colors={[COLORS.orange, '#D68910']}
              icon={<Clock size={14} color="rgba(255,255,255,0.8)" />}
              delay={120}
            />
            <StatCard
              label="Completion" value={`${stats.rate}%`}
              colors={[COLORS.purple, '#6C3483']}
              icon={<TrendingUp size={14} color="rgba(255,255,255,0.8)" />}
              delay={180}
            />
          </View>
        </Animated.View>

        {/* Recent tasks */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <Text style={[styles.seeAll, { color: COLORS.blue }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.bgCard }]}>
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No tasks yet</Text>
              <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>Create your first task to get started</Text>
              <TouchableOpacity onPress={() => router.push('/tasks/new')} activeOpacity={0.8}>
                <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.emptyBtn}>
                  <Plus size={16} color="#fff" />
                  <Text style={styles.emptyBtnText}>Create Task</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            recentTasks.map((t, i) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => router.push(`/tasks/${t.id}`)}
                style={[styles.recentRow, { backgroundColor: theme.bgCard }]}
              >
                <View style={[styles.dot, {
                  backgroundColor: t.status === 'completed' ? COLORS.green
                    : t.status === 'in_progress' ? COLORS.orange : theme.border
                }]} />
                <Text style={[styles.recentTitle, { color: theme.text },
                  t.status === 'completed' && { textDecorationLine: 'line-through', color: theme.textMuted }
                ]} numberOfLines={1}>
                  {t.title}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.qaGrid}>
            {[
              { label: 'Create Board', icon: <Folder size={18} color="#fff" />, colors: [COLORS.blue, '#357ABD'] as [string,string], route: '/boards/new' },
              { label: 'Add Task',    icon: <Plus size={18} color="#fff" />,   colors: [COLORS.green, '#1E8449'] as [string,string], route: '/tasks/new' },
              { label: 'Analytics',  icon: <BarChart2 size={18} color="#fff" />, colors: [COLORS.purple, '#6C3483'] as [string,string], route: '/analytics' },
              { label: 'Quick Task', icon: <Zap size={18} color="#fff" />,    colors: [COLORS.orange, '#D68910'] as [string,string], route: '/tasks/new' },
            ].map((qa, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(qa.route as any)} activeOpacity={0.8} style={styles.qaItem}>
                <LinearGradient colors={qa.colors} style={styles.qaBtn}>
                  {qa.icon}
                  <Text style={styles.qaText}>{qa.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: SPACING.xxxl },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop:        SPACING.md,
    paddingBottom:     SPACING.lg,
  },
  headerGrad: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 60,
  },
  headerInner: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  greet:       { fontSize: FONTS.sizes.sm, marginBottom: 2 },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700' },
  addBtn:      { borderRadius: RADIUS.md, overflow: 'hidden' },
  addGrad:     { padding: SPACING.sm, borderRadius: RADIUS.md },
  quickNav: {
    flexDirection:   'row',
    gap:             SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom:    SPACING.lg,
  },
  quickBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.xs,
    paddingVertical:   SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius:   RADIUS.md,
  },
  quickText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  statsGrid: {
    paddingHorizontal: SPACING.lg,
    gap:               SPACING.sm,
    marginBottom:      SPACING.xl,
  },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  section:  { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  seeAll:       { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding:      SPACING.xxxl,
    alignItems:   'center',
    gap:          SPACING.sm,
  },
  emptyTitle:   { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  emptyDesc:    { fontSize: FONTS.sizes.sm, textAlign: 'center' },
  emptyBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.xs,
    paddingVertical:   SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius:   RADIUS.full,
    marginTop:      SPACING.sm,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  recentRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.sm,
    padding:        SPACING.md,
    borderRadius:   RADIUS.md,
    marginBottom:   SPACING.xs,
  },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  recentTitle: { flex: 1, fontSize: FONTS.sizes.sm },
  qaGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACING.sm,
    marginTop:     SPACING.md,
  },
  qaItem: { width: '47%' },
  qaBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.xs,
    padding:        SPACING.md,
    borderRadius:   RADIUS.md,
  },
  qaText: { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '600' },
});
