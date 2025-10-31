import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import App from './App';
import RecordDetail from './src/components/RecordDetail/RecordDetail';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="App">
        <Stack.Screen name="App" component={App} options={{ headerShown: false }} />
        <Stack.Screen name="RecordDetail" component={RecordDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;