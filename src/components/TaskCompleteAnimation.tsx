import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Line } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath   = Animated.createAnimatedComponent(Path);

interface Props {
  visible:   boolean;
  color?:    string;
  onDone?:   () => void;
}

// Particle burst positions (angle offsets for 8 particles)
const PARTICLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function TaskCompleteAnimation({ visible, color = '#27AE60', onDone }: Props) {
  const scale        = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale    = useSharedValue(0);
  const ringOpacity  = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      scale.value        = 0;
      checkOpacity.value = 0;
      ringScale.value    = 0;
      ringOpacity.value  = 0;
      return;
    }

    // 1. Pop in the circle
    scale.value = withSequence(
      withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(2)) }),
      withTiming(1.0, { duration: 100 }),
    );

    // 2. Draw checkmark
    checkOpacity.value = withDelay(150, withTiming(1, { duration: 200 }));

    // 3. Ring burst
    ringScale.value   = withDelay(100, withTiming(2.0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    ringOpacity.value = withDelay(100,
      withSequence(
        withTiming(1,   { duration: 50  }),
        withTiming(0,   { duration: 300 }),
      ),
    );

    // 4. Callback
    if (onDone) {
      setTimeout(() => runOnJS(onDone)(), 600);
    }
  }, [visible]);

  const circleProps = useAnimatedProps(() => ({
    transform: [{ scale: scale.value }] as any,
    opacity:   scale.value,
  }));

  const checkProps = useAnimatedProps(() => ({
    opacity: checkOpacity.value,
  }));

  const ringProps = useAnimatedProps(() => ({
    r:       String(20 * ringScale.value),
    opacity: ringOpacity.value,
    strokeWidth: 2 / ringScale.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Svg width={80} height={80} viewBox="0 0 80 80">
        {/* Ring burst */}
        <AnimatedCircle
          cx="40" cy="40"
          r="20"
          fill="none"
          stroke={color}
          animatedProps={ringProps}
        />
        {/* Background circle */}
        <AnimatedCircle
          cx="40" cy="40" r="22"
          fill={color}
          animatedProps={circleProps}
        />
        {/* Checkmark */}
        <AnimatedPath
          d="M28 40 L36 48 L52 32"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animatedProps={checkProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems:     'center',
    zIndex: 99,
  },
});
