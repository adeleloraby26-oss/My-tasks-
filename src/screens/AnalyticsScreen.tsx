import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Rect, Text as SvgText, Circle, Path } from 'react-native-svg';
import StatCard from '../components/StatCard';
import { useAppStore } from '../store/useAppStore';
import {
  COLORS, DARK_THEME, LIGHT_THEME,
  SPACING, RADIUS, FONTS,
} from '../utils/theme';
import {
  Layers, CheckCircle2, Clock, TrendingUp, AlertCircle,
} from 'lucide-react-native';

const W = Dimensions.get('window').width - SPACING.lg * 2;

export default function AnalyticsScreen() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const tasks      = useAppStore((s) => s.tasks);
  const boards     = useAppStore((s) => s.boards);
  const theme      = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const stats = useMemo(() => {
    const total      = tasks.length;
    const completed  = tasks.filter((t) => t.status === 'completed').length;
    const pending    = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue    = tasks.filter(
      (t) => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()
    ).length;
    const rate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, inProgress, overdue, rate, boards: boards.length };
  }, [tasks, boards]);

  // Bar chart data: tasks by priority
  const byPriority = useMemo(() => [
    { label: 'High',   count: tasks.filter((t) => t.priority === 'high').length,   color: COLORS.red    },
    { label: 'Medium', count: tasks.filter((t) => t.priority === 'medium').length, color: COLORS.orange },
    { label: 'Low',    count: tasks.filter((t) => t.priority === 'low').length,    color: COLORS.green  },
  ], [tasks]);

  const maxBar = Math.max(...byPriority.map((b) => b.count), 1);
  const barH   = 140;
  const barW   = (W - SPACING.xl * 2) / byPriority.length - 16;

  // Donut chart
  const statusData = [
    { label: 'Completed',   value: stats.completed,  color: COLORS.green  },
    { label: 'Pending',     value: stats.pending,    color: COLORS.orange },
    { label: 'In Progress', value: stats.inProgress, color: COLORS.purple },
  ];
  const totalDonut = statusData.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const donutR  = 60;
  const donutCx = W / 2;
  const donutCy = 90;
  const segments = statusData.map((d) => {
    const pct   = d.value / totalDonut;
    const start = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const end  = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1   = donutCx + donutR * Math.cos(start);
    const y1   = donutCy + donutR * Math.sin(start);
    const x2   = donutCx + donutR * Math.cos(end);
    const y2   = donutCy + donutR * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    return {
      ...d, pct,
      path: pct > 0 && pct < 1
        ? `M ${donutCx} ${donutCy} L ${x1} ${y1} A ${donutR} ${donutR} 0 ${large} 1 ${x2} ${y2} Z`
        : pct >= 1
        ? `M ${donutCx} ${donutCy} m -${donutR} 0 a ${donutR} ${donutR} 0 1 0 ${donutR * 2} 0 a ${donutR} ${donutR} 0 1 0 -${donutR * 2} 0`
        : '',
    };
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
        <Text style={[styles.sub,   { color: theme.textSub }]}>Insights across your tasks & boards</Text>

        {/* Stat grid */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.grid}>
          <View style={styles.row}>
            <StatCard label="Total Tasks"   value={stats.total}     colors={[COLORS.blue,   '#357ABD']} icon={<Layers     size={14} color="rgba(255,255,255,0.8)" />} delay={0}   />
            <StatCard label="Completion"    value={`${stats.rate}%`} colors={[COLORS.green,  '#1E8449']} icon={<CheckCircle2 size={14} color="rgba(255,255,255,0.8)" />} delay={60}  />
          </View>
          <View style={styles.row}>
            <StatCard label="Overdue"       value={stats.overdue}   colors={[COLORS.red,    '#C0392B']} icon={<AlertCircle size={14} color="rgba(255,255,255,0.8)" />} delay={120} />
            <StatCard label="Active Boards" value={stats.boards}    colors={[COLORS.purple, '#6C3483']} icon={<TrendingUp  size={14} color="rgba(255,255,255,0.8)" />} delay={180} />
          </View>
        </Animated.View>

        {/* Status donut */}
        <Animated.View entering={FadeInDown.delay(200).springify()}
          style={[styles.card, { backgroundColor: theme.bgCard }]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>Task Status Distribution</Text>

          <Svg width={W - SPACING.xl * 2} height={190}>
            {segments.map((s, i) => (
              s.path ? <Path key={i} d={s.path} fill={s.color} /> : null
            ))}
            {/* Center hole */}
            <Circle cx={donutCx} cy={donutCy} r={36} fill={theme.bgCard} />
            <SvgText x={donutCx} y={donutCy + 5} textAnchor="middle" fill={theme.text} fontSize="16" fontWeight="bold">
              {stats.rate}%
            </SvgText>

            {/* Legend */}
            {statusData.map((d, i) => (
              <React.Fragment key={i}>
                <Circle cx={20} cy={170 + i * 0 - 0} r={5} fill={d.color} />
              </React.Fragment>
            ))}
          </Svg>

          {/* Legend below */}
          <View style={styles.legend}>
            {statusData.map((d) => (
              <View key={d.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={[styles.legendText, { color: theme.textSub }]}>
                  {d.label} ({d.value})
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Priority bar chart */}
        <Animated.View entering={FadeInDown.delay(280).springify()}
          style={[styles.card, { backgroundColor: theme.bgCard }]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>Priority Distribution</Text>

          <Svg width={W - SPACING.xl * 2} height={barH + 40}>
            {byPriority.map((b, i) => {
              const bH  = (b.count / maxBar) * barH;
              const bX  = i * ((W - SPACING.xl * 2) / byPriority.length) + 16;
              const bY  = barH - bH;
              return (
                <React.Fragment key={b.label}>
                  <Rect
                    x={bX} y={bY}
                    width={barW} height={bH || 4}
                    rx={6} fill={b.color}
                    opacity={0.9}
                  />
                  <SvgText
                    x={bX + barW / 2} y={barH + 20}
                    textAnchor="middle"
                    fill={theme.textSub}
                    fontSize="12"
                  >
                    {b.label}
                  </SvgText>
                  <SvgText
                    x={bX + barW / 2} y={bY - 6}
                    textAnchor="middle"
                    fill={b.color}
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {b.count}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </Animated.View>

        {/* Completion progress */}
        <Animated.View entering={FadeInDown.delay(320).springify()}
          style={[styles.card, { backgroundColor: theme.bgCard }]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>Overall Progress</Text>

          <View style={styles.progressWrap}>
            <View style={[styles.progressBg, { backgroundColor: theme.bgInput }]}>
              <Animated.View
                style={[styles.progressFill, {
                  width:           `${stats.rate}%`,
                  backgroundColor: stats.rate > 66 ? COLORS.green : stats.rate > 33 ? COLORS.orange : COLORS.red,
                }]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.text }]}>{stats.rate}%</Text>
          </View>

          <View style={styles.progressStats}>
            <Text style={[styles.progressStat, { color: theme.textSub }]}>
              {stats.completed} of {stats.total} tasks completed
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg },
  title:  { fontSize: FONTS.sizes.xxl, fontWeight: '800', marginBottom: 4 },
  sub:    { fontSize: FONTS.sizes.sm, marginBottom: SPACING.xl },
  grid:   { gap: SPACING.sm, marginBottom: SPACING.lg },
  row:    { flexDirection: 'row', gap: SPACING.sm },
  card: {
    borderRadius:  RADIUS.xl,
    padding:       SPACING.lg,
    marginBottom:  SPACING.md,
    alignItems:    'center',
  },
  cardTitle: {
    fontSize:     FONTS.sizes.md,
    fontWeight:   '700',
    alignSelf:    'flex-start',
    marginBottom: SPACING.md,
  },
  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, alignSelf: 'flex-start' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FONTS.sizes.xs },
  progressWrap: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.md,
    width:          '100%',
    marginBottom:   SPACING.sm,
  },
  progressBg: {
    flex:         1,
    height:       12,
    borderRadius: 6,
    overflow:     'hidden',
  },
  progressFill: {
    height:       12,
    borderRadius: 6,
  },
  progressText: { fontSize: FONTS.sizes.sm, fontWeight: '700', width: 36 },
  progressStats: { alignSelf: 'flex-start' },
  progressStat:  { fontSize: FONTS.sizes.sm },
});
