import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Camera, Moon, Sun, LogOut, User, Edit3 } from 'lucide-react-native';
import { supabase } from '../services/supabase';
import { useAppStore } from '../store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, SPACING, RADIUS, FONTS } from '../utils/theme';

export default function ProfileScreen() {
  const isDarkMode  = useAppStore((s) => s.isDarkMode);
  const profile     = useAppStore((s) => s.profile);
  const setProfile  = useAppStore((s) => s.setProfile);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme       = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username,    setUsername]    = useState(profile?.username || '');
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [editing,     setEditing]     = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !profile) return;

    setUploading(true);
    try {
      const uri  = result.assets[0].uri;
      const ext  = uri.split('.').pop() ?? 'jpg';
      const path = `${profile.id}/avatar.${ext}`;

      const response  = await fetch(uri);
      const blob      = await response.blob();
      const arrayBuf  = await blob.arrayBuffer();

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuf, { contentType: `image/${ext}`, upsert: true });

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, username })
        .eq('id', profile.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      setEditing(false);
      Alert.alert('Saved!', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setProfile(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header gradient */}
        <LinearGradient
          colors={['#8B7FD4', '#4A90E2']}
          style={styles.headerBg}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />

        {/* Avatar */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
            {uploading ? (
              <View style={[styles.avatar, { backgroundColor: theme.bgCard, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.blue} />
              </View>
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#F5D78E', '#8B7FD4']} style={styles.avatar}>
                <Text style={styles.avatarInitial}>
                  {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.cameraBtn}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.name, { color: theme.text }]}>
            {profile?.display_name || profile?.username}
          </Text>
          <Text style={[styles.username, { color: theme.textSub }]}>
            @{profile?.username}
          </Text>
        </Animated.View>

        {/* Edit profile */}
        <Animated.View entering={FadeInDown.delay(100).springify()}
          style={[styles.card, { backgroundColor: theme.bgCard }]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <User size={16} color={COLORS.purple} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Profile Info</Text>
            </View>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Edit3 size={16} color={editing ? COLORS.blue : theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textSub }]}>Display Name</Text>
            <TextInput
              style={[styles.fieldInput, {
                color: theme.text,
                backgroundColor: editing ? theme.bgInput : 'transparent',
                borderColor: theme.border,
                borderWidth: editing ? 1 : 0,
              }]}
              value={displayName}
              onChangeText={setDisplayName}
              editable={editing}
              placeholder="Your name"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textSub }]}>Username</Text>
            <TextInput
              style={[styles.fieldInput, {
                color: theme.text,
                backgroundColor: editing ? theme.bgInput : 'transparent',
                borderColor: theme.border,
                borderWidth: editing ? 1 : 0,
              }]}
              value={username}
              onChangeText={setUsername}
              editable={editing}
              autoCapitalize="none"
              placeholder="username"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {editing && (
            <TouchableOpacity onPress={saveProfile} disabled={saving} activeOpacity={0.8}>
              <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(180).springify()}
          style={[styles.card, { backgroundColor: theme.bgCard }]}
        >
          <Text style={[styles.cardTitle, { color: theme.text, marginBottom: SPACING.md }]}>Settings</Text>

          {/* Dark mode toggle */}
          <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
            <View style={styles.settingLeft}>
              {isDarkMode
                ? <Moon size={20} color={COLORS.purple} />
                : <Sun  size={20} color={COLORS.orange} />
              }
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isDarkMode ? COLORS.purple : COLORS.orange }]}>
              <View style={[styles.toggleKnob, isDarkMode && styles.toggleKnobRight]} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Sign out */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: COLORS.red + '18' }]} onPress={handleSignOut}>
            <LogOut size={18} color={COLORS.red} />
            <Text style={[styles.signOutText, { color: COLORS.red }]}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  scroll:    { paddingBottom: SPACING.xxxl },
  headerBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 180,
  },
  avatarSection: {
    alignItems:    'center',
    paddingTop:    SPACING.xxxl,
    paddingBottom: SPACING.xl,
  },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 96, height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems:     'center',
  },
  avatarInitial: { fontSize: 40, color: '#fff', fontWeight: '700' },
  cameraBtn: {
    position:       'absolute',
    bottom: 0, right: 0,
    backgroundColor: COLORS.blue,
    borderRadius:    14,
    width: 28, height: 28,
    justifyContent: 'center',
    alignItems:     'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  name:     { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff' },
  username: { fontSize: FONTS.sizes.sm, marginTop: 2, color: 'rgba(255,255,255,0.7)' },
  card: {
    marginHorizontal: SPACING.lg,
    borderRadius:     RADIUS.xl,
    padding:          SPACING.lg,
    marginBottom:     SPACING.md,
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACING.md,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  field:      { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: {
    fontSize:        FONTS.sizes.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius:    RADIUS.sm,
  },
  saveBtn: {
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems:      'center',
    marginTop:       SPACING.xs,
  },
  saveBtnText:  { color: '#fff', fontWeight: '700' },
  settingRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  settingLabel: { fontSize: FONTS.sizes.md },
  toggle: {
    width: 44, height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  toggleKnobRight: { alignSelf: 'flex-end' },
  signOutBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    marginHorizontal: SPACING.lg,
    padding:        SPACING.md,
    borderRadius:   RADIUS.xl,
  },
  signOutText: { fontSize: FONTS.sizes.md, fontWeight: '700' },
});
