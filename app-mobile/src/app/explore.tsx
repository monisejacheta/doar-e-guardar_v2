// app-mobile/src/app/explore.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';

export default function ExploreRedirectScreen() {
  const roteador = useRouter();
  const { theme } = useAppTheme();

  useEffect(() => {
    roteador.replace('/home');
  }, [roteador]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}
