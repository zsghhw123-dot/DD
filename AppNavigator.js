import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import App from './App';
import RecordDetail from './src/components/RecordDetail/RecordDetail';
import MainTabs from './src/navigation/MainTabs';
import { SettingsProvider } from './src/context/SettingsContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <SettingsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MainTabs">
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="RecordDetail" component={RecordDetail} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
};

export default AppNavigator;
