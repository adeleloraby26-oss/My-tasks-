import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, SPACING, FONTS } from '../utils/theme';

interface Props {
  label:    string;
  value:    string | number;
  sublabel?: string;
  colors:   [string, string];
  icon:     React.ReactNode;
  delay?:   number;
}

export default function StatCard({ label, value, sublabel, colors, icon, delay = 0 }: Props) {
  const scale   = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withDelay(delay, withSpring(1, { damping: 14, stiffness: 120 }));
    opacity.value = withDelay(delay, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <LinearGradient colors={colors} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Decorative circle */}
        <View style={styles.circle} />

        <View style={styles.iconRow}>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>{value}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding:      SPACING.lg,
    overflow:     'hidden',
    minHeight:    100,
    justifyContent: 'flex-end',
  },
  circle: {
    position:      'absolute',
    top:           -20,
    right:         -20,
    width:         80,
    height:        80,
    borderRadius:  40,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.xs,
    marginBottom:  SPACING.xs,
  },
  label: {
    color:      'rgba(255,255,255,0.85)',
    fontSize:   FONTS.sizes.sm,
    fontWeight: '500',
  },
  value: {
    color:      '#fff',
    fontSize:   FONTS.sizes.xxxl,
    fontWeight: '700',
    lineHeight: 36,
  },
  sublabel: {
    color:    'rgba(255,255,255,0.7)',
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
});
