import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import App from '../../App';
import StatsScreen from '../screens/StatsScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';
import HomeIcon from '../assets/icons/hoem.svg';
import StatsIcon from '../assets/icons/tongji.svg';
import ActivityIcon from '../assets/icons/Activity.svg';
import SettingsIcon from '../assets/icons/shezhi.svg';

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
          switch (route.name) {
            case '首页':
              return <HomeIcon width={22} height={22} color={color} />;
            case '统计':
              return <StatsIcon width={22} height={22} color={color} />;
            case '活动':
              return <ActivityIcon width={22} height={22} color={color} />;
            case '配置':
              return <SettingsIcon width={22} height={22} color={color} />;
            default:
              return <HomeIcon width={22} height={22} color={color} />;
          }
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
