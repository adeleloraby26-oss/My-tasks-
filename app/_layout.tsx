import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../src/services/supabase';
import { useAppStore } from '../src/store/useAppStore';
import AuthScreen from '../src/screens/AuthScreen';
import AppNavigator from './AppNavigator';

export default function RootLayout() {
  const isDarkMode     = useAppStore((s) => s.isDarkMode);
  const setProfile     = useAppStore((s) => s.setProfile);
  const isAuthLoaded   = useAppStore((s) => s.isAuthLoaded);
  const profile        = useAppStore((s) => s.profile);
  const loadLocal      = useAppStore((s) => s.loadLocal);
  const syncFromServer = useAppStore((s) => s.syncFromServer);
  const setOnline      = useAppStore((s) => s.setOnline);
  const flushQueue     = useAppStore((s) => s.flushQueue);

  useEffect(() => {
    loadLocal();

    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setOnline(online);
      if (online) flushQueue();
    });

    // جيب الـ session المحفوظة فوراً
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data || null);
        syncFromServer();
      } else {
        setProfile(null);
      }
    });

    // استمع لأي تغيير في الـ auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return;
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(data || null);
          syncFromServer();
        } else {
          setProfile(null);
        }
      }
    );

    return () => { subscription.unsubscribe(); unsub(); };
  }, []);

  if (!isAuthLoaded) return <View style={[styles.splash, { backgroundColor: '#000' }]} />;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {profile ? (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      ) : (
        <AuthScreen />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  splash: { flex: 1 },
});
