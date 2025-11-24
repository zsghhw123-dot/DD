import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home/HomeScreen';
import RecordDetailScreen from '../screens/RecordDetail/RecordDetailScreen';
import MainTabs from '../navigation/MainTabs';
import { SettingsProvider } from '../context/SettingsContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <SettingsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MainTabs">
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
};

export default AppNavigator;
