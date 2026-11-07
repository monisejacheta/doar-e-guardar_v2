// src/app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { BottomNavBar } from '../components/common/BottomNavBar';

function RootNavigationLayout() {
  const { theme, mode } = useAppTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' || mode === 'high-contrast' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Doar & Guardar - Entrada' }} />
        <Stack.Screen name="home" options={{ title: 'Início', headerBackVisible: false }} />
        <Stack.Screen name="stock" options={{ title: 'Gerenciamento de Estoque' }} />
        <Stack.Screen name="stock-add" options={{ title: 'Entrada de Alimentos' }} />
        <Stack.Screen name="stock-remove" options={{ title: 'Saída e Baixa de Estoque' }} />
        <Stack.Screen name="stock-move" options={{ title: 'Movimentação Interna' }} />
        <Stack.Screen name="stock-details" options={{ title: 'Consulta de Lotes' }} />
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
