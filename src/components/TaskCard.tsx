import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { CheckCircle2, Circle, Trash2, Clock } from 'lucide-react-native';
import TaskCompleteAnimation from './TaskCompleteAnimation';
import type { Task } from '../types';
import type { Theme } from '../utils/theme';
import { COLORS, SPACING, RADIUS, FONTS } from '../utils/theme';

interface Props {
  task:       Task;
  theme:      Theme;
  onComplete: (id: string) => void;
  onDelete:   (id: string) => void;
  onPress:    (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high:   COLORS.red,
  medium: COLORS.orange,
  low:    COLORS.green,
};

export default function TaskCard({ task, theme, onComplete, onDelete, onPress }: Props) {
  const [showAnim, setShowAnim] = useState(false);
  const translateX  = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale   = useSharedValue(1);

  const isCompleted = task.status === 'completed';

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (e) => {
      translateX.value = Math.max(-120, Math.min(0, e.translationX));
    },
    onEnd: (e) => {
      if (e.translationX < -80) {
        // Reveal delete
        translateX.value = withSpring(-90);
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
  }));

  const handleComplete = () => {
    if (isCompleted) return;
    setShowAnim(true);
    cardScale.value = withTiming(0.97, { duration: 100 });
    setTimeout(() => {
      onComplete(task.id);
      setShowAnim(false);
      cardScale.value = withSpring(1);
      translateX.value = withSpring(0);
    }, 700);
  };

  const handleDelete = () => {
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value   = withTiming(0.85, { duration: 200 });
    setTimeout(() => onDelete(task.id), 200);
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity:   cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const isOverdue = task.due_date && !isCompleted && new Date(task.due_date) < new Date();

  return (
    <Animated.View style={[styles.wrapper, cardAnimStyle]}>
      {/* Delete bg */}
      <Animated.View style={[styles.deleteBg, deleteStyle]}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Trash2 color="#fff" size={20} />
        </TouchableOpacity>
      </Animated.View>

      <PanGestureHandler onGestureEvent={gestureHandler} activeOffsetX={[-10, 10]}>
        <Animated.View style={[styles.card, { backgroundColor: theme.bgCard }, animStyle]}>
          <TaskCompleteAnimation visible={showAnim} color={COLORS.green} />

          {/* Priority bar */}
          <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />

          <Pressable style={styles.inner} onPress={() => onPress(task)}>
            {/* Checkbox */}
            <TouchableOpacity onPress={handleComplete} style={styles.checkbox} hitSlop={8}>
              {isCompleted
                ? <CheckCircle2 color={COLORS.green} size={24} />
                : <Circle color={theme.textMuted} size={24} />
              }
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              <Text
                style={[
                  styles.title,
                  { color: theme.text },
                  isCompleted && { textDecorationLine: 'line-through', color: theme.textMuted },
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>

              {task.description ? (
                <Text style={[styles.desc, { color: theme.textSub }]} numberOfLines={1}>
                  {task.description}
                </Text>
              ) : null}

              <View style={styles.meta}>
                {task.due_date ? (
                  <View style={[styles.badge, { backgroundColor: isOverdue ? COLORS.red + '22' : theme.bgInput }]}>
                    <Clock size={11} color={isOverdue ? COLORS.red : theme.textMuted} />
                    <Text style={[styles.badgeText, { color: isOverdue ? COLORS.red : theme.textMuted }]}>
                      {formatDate(task.due_date)}
                    </Text>
                  </View>
                ) : null}

                <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[task.priority] + '22' }]}>
                  <Text style={[styles.badgeText, { color: PRIORITY_COLORS[task.priority] }]}>
                    {task.priority}
                  </Text>
                </View>

                {task._pendingSync ? (
                  <View style={[styles.badge, { backgroundColor: COLORS.orange + '22' }]}>
                    <Text style={[styles.badgeText, { color: COLORS.orange }]}>offline</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

function formatDate(iso: string) {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACING.lg,
    marginBottom:     SPACING.sm,
  },
  deleteBg: {
    position:        'absolute',
    right:           0,
    top:             0,
    bottom:          0,
    width:           90,
    backgroundColor: COLORS.red,
    borderRadius:    RADIUS.lg,
    justifyContent:  'center',
    alignItems:      'center',
  },
  deleteBtn: {
    padding: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    overflow:     'hidden',
    flexDirection: 'row',
  },
  priorityBar: {
    width: 4,
  },
  inner: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'flex-start',
    padding:        SPACING.md,
    gap:            SPACING.sm,
  },
  checkbox: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap:  SPACING.xs,
  },
  title: {
    fontSize:   FONTS.sizes.md,
    fontWeight: '600',
    lineHeight: 20,
  },
  desc: {
    fontSize: FONTS.sizes.sm,
  },
  meta: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACING.xs,
    marginTop:     SPACING.xs,
  },
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            3,
    paddingVertical:   3,
    paddingHorizontal: 8,
    borderRadius:   RADIUS.full,
  },
  badgeText: {
    fontSize:   FONTS.sizes.xs,
    fontWeight: '500',
  },
});
