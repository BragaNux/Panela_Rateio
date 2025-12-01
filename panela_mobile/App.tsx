import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const load = useAuthStore(state => state.loadStoredAuth);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
