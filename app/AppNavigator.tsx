import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, CheckSquare, BarChart2, User, Folder } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import HomeScreen       from '../src/screens/HomeScreen';
import TasksScreen      from '../src/screens/TasksScreen';
import NewTaskScreen    from '../src/screens/NewTaskScreen';
import TaskDetailScreen from '../src/screens/TaskDetailScreen';
import BoardsScreen     from '../src/screens/BoardsScreen';
import AnalyticsScreen  from '../src/screens/AnalyticsScreen';
import ProfileScreen    from '../src/screens/ProfileScreen';
import OfflineBanner    from '../src/components/OfflineBanner';

import { useAppStore } from '../src/store/useAppStore';
import { COLORS, DARK_THEME, LIGHT_THEME, RADIUS, SPACING } from '../src/utils/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TasksStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TasksList"  component={TasksScreen} />
      <Stack.Screen name="TasksNew"   component={NewTaskScreen}    options={{ presentation: 'modal' }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"   component={HomeScreen} />
      <Stack.Screen name="TasksNew"   component={NewTaskScreen}    options={{ presentation: 'modal' }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="Boards"     component={BoardsScreen} />
      <Stack.Screen name="Analytics"  component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

const TABS = [
  { name: 'HomeTab',      component: HomeStack,       icon: Home,        label: 'Home'      },
  { name: 'TasksTab',     component: TasksStack,      icon: CheckSquare, label: 'Tasks'     },
  { name: 'BoardsTab',    component: BoardsScreen,    icon: Folder,      label: 'Boards'    },
  { name: 'AnalyticsTab', component: AnalyticsScreen, icon: BarChart2,   label: 'Analytics' },
  { name: 'ProfileTab',   component: ProfileScreen,   icon: User,        label: 'Profile'   },
];

export default function AppNavigator() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const theme      = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} theme={theme} isDarkMode={isDarkMode} />}
      >
        {TABS.map((t) => (
          <Tab.Screen key={t.name} name={t.name} component={t.component}
            options={{ tabBarLabel: t.label, tabBarIcon: t.icon as any }}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation, theme, isDarkMode }: any) {
  return (
    <View style={[styles.tabBar, {
      backgroundColor: isDarkMode ? '#0D0D0D' : '#fff',
      borderTopColor:  theme.border,
    }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused   = state.index === index;
        const IconComp    = options.tabBarIcon;
        const label       = options.tabBarLabel;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
            style={styles.tabItem}
          >
            {isFocused ? (
              <LinearGradient colors={['#8B7FD4', COLORS.blue]} style={styles.activeIndicator}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <IconComp size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={styles.inactiveIcon}>
                <IconComp size={22} color={theme.textMuted} />
              </View>
            )}
            <Text style={[styles.tabLabel, {
              color: isFocused ? COLORS.blue : theme.textMuted,
              fontWeight: isFocused ? '700' : '400',
            }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingBottom: SPACING.sm, paddingTop: SPACING.sm, paddingHorizontal: SPACING.xs,
  },
  tabItem:         { flex: 1, alignItems: 'center', gap: 2 },
  activeIndicator: { width: 44, height: 28, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  inactiveIcon:    { height: 28, justifyContent: 'center', alignItems: 'center' },
  tabLabel:        { fontSize: 10 },
});
