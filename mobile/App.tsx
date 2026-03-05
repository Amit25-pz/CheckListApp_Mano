import React from 'react';
import { I18nManager, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ChecklistScreen } from './src/screens/ChecklistScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { ReportInfoScreen } from './src/screens/ReportInfoScreen';
import { ExportScreen } from './src/screens/ExportScreen';
import {
  RootTabParamList,
  ChecklistStackParamList,
  RootStackParamList,
} from './src/types';
import { theme } from './src/theme';
import { useReport } from './src/store/useReport';

// ─── Force RTL for Hebrew UI ─────────────────────────────────────────────────
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// ─── Navigators ──────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();
const ChecklistStack = createNativeStackNavigator<ChecklistStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function ChecklistStackNavigator() {
  return (
    <ChecklistStack.Navigator screenOptions={{ headerShown: false }}>
      <ChecklistStack.Screen name="ChecklistMain" component={ChecklistScreen} />
      <ChecklistStack.Screen name="Category" component={CategoryScreen} />
    </ChecklistStack.Navigator>
  );
}

// ─── Tab icon helper ─────────────────────────────────────────────────────────

function tabIcon(routeName: string): string {
  switch (routeName) {
    case 'ChecklistTab': return '📋';
    case 'ReportInfo':   return '📝';
    case 'Export':       return '📤';
    default:             return '•';
  }
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textDark,
        tabBarStyle: {
          backgroundColor: theme.primary,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused }) => {
          const { Text } = require('react-native');
          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
              {tabIcon(route.name)}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="ChecklistTab"
        component={ChecklistStackNavigator}
        options={{ title: 'רשימת בדיקה' }}
      />
      <Tab.Screen
        name="ReportInfo"
        component={ReportInfoScreen}
        options={{ title: 'פרטי דוח' }}
      />
      <Tab.Screen
        name="Export"
        component={ExportScreen}
        options={{ title: 'ייצוא' }}
      />
    </Tab.Navigator>
  );
}

// ─── Root app ────────────────────────────────────────────────────────────────

function RootNavigator() {
  const isSetupComplete = useReport((s) => s.isSetupComplete);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isSetupComplete ? (
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <RootStack.Screen name="Setup" component={ReportInfoScreen} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={theme.primary} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
