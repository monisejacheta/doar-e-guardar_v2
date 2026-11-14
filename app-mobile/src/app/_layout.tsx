// src/app/_layout.tsx
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { BottomNavBar } from '../components/common/BottomNavBar';

const WALLPAPER_APP_ASSET = require('../../assets/images/wallpaperApp.jpg');

function RootNavigationLayout() {
  const { theme, mode } = useAppTheme();
  const rotaAtual = usePathname();
  const ehTelaLogin = rotaAtual === '/';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {!ehTelaLogin && (
        <ImageBackground
          source={WALLPAPER_APP_ASSET}
          style={StyleSheet.absoluteFill}
          imageStyle={{
            opacity: mode === 'high-contrast' ? 0.12 : mode === 'dark' ? 0.18 : 0.25,
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
          pointerEvents="none"
        />
      )}
      <StatusBar
        style={mode === 'dark' || mode === 'high-contrast' ? 'light' : 'dark'}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: ehTelaLogin ? theme.background : 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Doar & Guardar - Entrada' }} />
        <Stack.Screen name="home" options={{ title: 'Início', headerBackVisible: false }} />
        <Stack.Screen name="stock" options={{ title: 'Gerenciamento de Estoque' }} />
        <Stack.Screen name="stock-add" options={{ title: 'Entrada de Alimentos' }} />
        <Stack.Screen name="stock-remove" options={{ title: 'Saída e Baixa de Estoque' }} />
        <Stack.Screen name="stock-move" options={{ title: 'Movimentação Interna' }} />
        <Stack.Screen name="reports" options={{ title: 'Central de Relatórios' }} />
        <Stack.Screen name="reports-stock" options={{ title: 'Relatório de Estoque Atual' }} />
        <Stack.Screen name="reports-movements" options={{ title: 'Relatório de Movimentações' }} />
        <Stack.Screen name="reports-losses" options={{ title: 'Relatório de Perdas e Descartes' }} />
        <Stack.Screen name="reports-expiry" options={{ title: 'Relatório de Validades (FEFO)' }} />
        <Stack.Screen name="audit" options={{ title: 'Histórico e Auditoria' }} />
        <Stack.Screen name="dora" options={{ title: 'Assistente Dora IA' }} />
        <Stack.Screen name="notifications" options={{ title: 'Avisos e Alertas' }} />
        <Stack.Screen name="settings" options={{ title: 'Configurações do Sistema' }} />
        <Stack.Screen name="settings-storage" options={{ title: 'Prateleiras e Locais AWS' }} />
        <Stack.Screen name="diagnostic" options={{ title: 'Diagnóstico da Infraestrutura' }} />
        <Stack.Screen name="profile" options={{ title: 'Meu Perfil' }} />
        <Stack.Screen name="accessibility" options={{ title: 'Acessibilidade e Leitura' }} />
      </Stack>

      <BottomNavBar />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigationLayout />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
