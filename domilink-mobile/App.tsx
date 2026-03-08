import React from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// GestureHandlerRootView is a native-only requirement.
// On web it is not needed and importing it can cause issues if the native
// gesture module is not available, so we conditionally wrap only on native.
let GestureHandlerRootView: React.ComponentType<{ style: any; children: React.ReactNode }>;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
} else {
  GestureHandlerRootView = ({ style, children }: { style: any; children: React.ReactNode }) =>
    React.createElement(View, { style }, children);
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
