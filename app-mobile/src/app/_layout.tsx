// src/app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { BottomNavBar } from '../components/common/BottomNavBar'; // IMPORTANTE: Importe o componente

function RootNavigationLayout() {
  const { theme, mode } = useAppTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' || mode === 'high-contrast' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Doar & Guardar - Entrada' }} />
        <Stack.Screen name="home" options={{ title: 'Início', headerBackVisible: false }} />
        <Stack.Screen name="stock" options={{ title: 'Gerenciamento de Estoque' }} />
        <Stack.Screen name="reports" options={{ title: 'Central de Relatórios' }} />
        {/* Certifique-se de ter as outras rotas aqui... */}
      </Stack>

      {/* WIDGET INFERIOR GLOBAL */}
      <BottomNavBar /> 
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigationLayout />
    </ThemeProvider>
  );
}