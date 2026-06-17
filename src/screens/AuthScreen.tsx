import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../services/supabase';
import { useAppStore } from '../store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, SPACING, RADIUS, FONTS } from '../utils/theme';

export default function AuthScreen() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const theme      = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const [mode,     setMode]     = useState<'login' | 'signup'>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      Alert.alert('Sent!', 'A new confirmation email has been sent.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            Alert.alert(
              'Email Not Confirmed',
              'Please confirm your email before logging in.',
              [
                { text: 'Resend Email', onPress: handleResendConfirmation },
                { text: 'OK', style: 'cancel' },
              ]
            );
          } else {
            throw error;
          }
        }
      } else {
        if (!username) { Alert.alert('Error', 'Username is required'); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username, display_name: username } },
        });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          Alert.alert('Already Registered', 'This email is already registered. Please log in.');
          setMode('login');
        } else {
          Alert.alert('Success', 'Check your email to confirm your account!');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#0D0D1A', '#000000']} style={styles.bg}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo / Hero */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.hero}>
            <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.logoBox}>
              <Text style={styles.logoText}>✓</Text>
            </LinearGradient>
            <Text style={styles.appName}>My Tasks</Text>
            <Text style={styles.tagline}>Stay organized, stay productive</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={[styles.card, { backgroundColor: theme.bgCard }]}
          >
            {/* Mode toggle */}
            <View style={[styles.toggle, { backgroundColor: theme.bgInput }]}>
              {(['login', 'signup'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.toggleBtn, mode === m && styles.toggleActive]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.toggleText, { color: mode === m ? '#fff' : theme.textMuted }]}>
                    {m === 'login' ? 'Login' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fields */}
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.textSub }]}>Username</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.bgInput, color: theme.text, borderColor: theme.border }]}
                  placeholder="your_username"
                  placeholderTextColor={theme.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSub }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bgInput, color: theme.text, borderColor: theme.border }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSub }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bgInput, color: theme.text, borderColor: theme.border }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.blue, COLORS.purple]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg:     { flex: 1 },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  hero: {
    alignItems:   'center',
    marginBottom: SPACING.xxxl,
  },
  logoBox: {
    width:         72,
    height:        72,
    borderRadius:  RADIUS.xl,
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   SPACING.md,
  },
  logoText:  { fontSize: 36, color: '#fff', fontWeight: '700' },
  appName:   { fontSize: FONTS.sizes.xxxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tagline:   { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.5)', marginTop: SPACING.xs },
  card: {
    borderRadius: RADIUS.xl,
    padding:      SPACING.xl,
    gap:          SPACING.lg,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius:  RADIUS.md,
    padding:       3,
  },
  toggleBtn: {
    flex:           1,
    paddingVertical: SPACING.sm,
    alignItems:     'center',
    borderRadius:   RADIUS.sm,
  },
  toggleActive: { backgroundColor: COLORS.blue },
  toggleText:   { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  fieldGroup:   { gap: SPACING.xs },
  label:        { fontSize: FONTS.sizes.sm, fontWeight: '500' },
  input: {
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    fontSize:        FONTS.sizes.md,
  },
  submitBtn: {
    borderRadius:   RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems:     'center',
    marginTop:      SPACING.xs,
  },
  submitText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
