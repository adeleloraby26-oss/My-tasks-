import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring,
} from 'react-native-reanimated';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, SPACING, FONTS } from '../utils/theme';

export default function OfflineBanner() {
  const isOnline    = useAppStore((s) => s.isOnline);
  const translateY  = useSharedValue(-60);
  const [wasOffline, setWasOffline] = React.useState(false);
  const [showBack,   setShowBack]   = React.useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowBack(false);
      translateY.value = withSpring(0);
    } else if (wasOffline) {
      setShowBack(true);
      setTimeout(() => {
        translateY.value = withTiming(-60, { duration: 400 });
        setTimeout(() => { setShowBack(false); setWasOffline(false); }, 400);
      }, 2000);
    }
  }, [isOnline]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!wasOffline && !showBack) return null;

  return (
    <Animated.View style={[styles.banner, { backgroundColor: isOnline ? COLORS.green : '#333' }, animStyle]}>
      {isOnline
        ? <Wifi  size={14} color="#fff" />
        : <WifiOff size={14} color="#fff" />
      }
      <Text style={styles.text}>
        {isOnline ? 'Back online — syncing...' : 'You\'re offline — changes saved locally'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
  },
  text: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '600' },
});
