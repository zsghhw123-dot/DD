import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import App from '../../App';
import StatsScreen from '../screens/StatsScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="首页"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.app.textPrimary,
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({ color }) => {
          const iconMap = {
            首页: '🏠',
            统计: '📊',
            活动: '📋',
            配置: '⚙️',
          };
          const icon = iconMap[route.name] || '⬤';
          return <Text style={{ color, fontSize: 18 }}>{icon}</Text>;
        },
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint={Platform.OS === 'ios' ? 'light' : 'default'}
            style={StyleSheet.absoluteFill}
          />
        ),
      })}
    >
      <Tab.Screen name="首页" component={App} />
      <Tab.Screen name="统计" component={StatsScreen} />
      <Tab.Screen name="活动" component={ActivitiesScreen} />
      <Tab.Screen name="配置" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
