// src/app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';

function RootNavigationLayout() {
  const { theme, mode } = useAppTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' || mode === 'high-contrast' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary, // Azul Guardar (#1E3A8A)
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Doar & Guardar - Entrada' }} />
        <Stack.Screen name="home" options={{ title: 'Início', headerBackVisible: false }} />
        <Stack.Screen name="profile" options={{ title: 'Meu Perfil' }} />
        <Stack.Screen name="notifications" options={{ title: 'Avisos e Notificações' }} />
        <Stack.Screen name="stock" options={{ title: 'Gerenciamento de Estoque' }} />
        <Stack.Screen name="profile-view" options={{ title: 'Visualizar Perfil' }} />
        <Stack.Screen name="profile-edit" options={{ title: 'Editar Perfil' }} />
        <Stack.Screen name="profile-preferences" options={{ title: 'Preferências do Usuário' }} />
        <Stack.Screen name="accessibility" options={{ title: 'Central de Acessibilidade' }} />
        <Stack.Screen name="accessibility-screen-reader" options={{ title: 'Leitor de Tela' }} />
        <Stack.Screen name="accessibility-voice-nav" options={{ title: 'Navegação por Voz' }} />
        <Stack.Screen name="accessibility-font-size" options={{ title: 'Tamanho da Fonte' }} />
        <Stack.Screen name="accessibility-high-contrast" options={{ title: 'Alto Contraste' }} />
        <Stack.Screen name="accessibility-dark-mode" options={{ title: 'Modo Escuro' }} />
        <Stack.Screen name="notifications-list" options={{ title: 'Lista de Notificações' }} />
        <Stack.Screen name="notifications-config" options={{ title: 'Configurar Notificações' }} />
        <Stack.Screen name="stock-add" options={{ title: 'Entrada de Produtos' }} />
        <Stack.Screen name="stock-remove" options={{ title: 'Remover Produtos do Estoque' }} />
        <Stack.Screen name="stock-move" options={{ title: 'Mover Produtos' }} />
        <Stack.Screen name="stock-details" options={{ title: 'Consulta Detalhada de Estoque' }} />
        <Stack.Screen name="reports" options={{ title: 'Central de Relatórios' }} />
        <Stack.Screen name="reports-stock" options={{ title: 'Relatório de Estoque Atual' }} />
        <Stack.Screen name="reports-movements" options={{ title: 'Relatório de Movimentações' }} />
        <Stack.Screen name="reports-losses" options={{ title: 'Relatório de Perdas e Descartes' }} />
        <Stack.Screen name="reports-expiry" options={{ title: 'Relatório de Validades' }} />
        <Stack.Screen name="dora" options={{ title: 'Assistente Dora' }} />
        <Stack.Screen name="settings" options={{ title: 'Configurações Avançadas' }} />
        <Stack.Screen name="settings-donors" options={{ title: 'Gerenciamento de Doadores' }} />
        <Stack.Screen name="settings-institutions" options={{ title: 'Gerenciamento de Instituições' }} />
        <Stack.Screen name="settings-campaigns" options={{ title: 'Campanhas de Doações Ativas' }} />
        <Stack.Screen name="settings-categories" options={{ title: 'Categorias de Alimentos' }} />
        <Stack.Screen name="settings-storage" options={{ title: 'Locais de Armazenamento' }} />
        <Stack.Screen name="settings-users" options={{ title: 'Usuários do Sistema' }} />
        <Stack.Screen name="settings-reasons" options={{ title: 'Motivos de Saída' }} />
        <Stack.Screen name="settings-sync" options={{ title: 'Status da Sincronização' }} />
        <Stack.Screen name="audit" options={{ title: 'Histórico e Auditoria' }} />
        <Stack.Screen name="audit-user" options={{ title: 'Auditoria por Usuário' }} />
        <Stack.Screen name="audit-product" options={{ title: 'Auditoria por Produto' }} />
        <Stack.Screen name="audit-period" options={{ title: 'Auditoria por Período' }} />
        <Stack.Screen name="audit-export" options={{ title: 'Exportar Histórico' }} />
        <Stack.Screen name="diagnostic" options={{ title: 'Verificar Disponibilidade' }} />
        <Stack.Screen name="diagnostic-aws" options={{ title: 'Serviços AWS' }} />
        <Stack.Screen name="diagnostic-database" options={{ title: 'Banco de Dados' }} />
        <Stack.Screen name="diagnostic-apis" options={{ title: 'APIs e Conectividade' }} />
        <Stack.Screen name="diagnostic-config" options={{ title: 'Configuração de Integrações' }} />
      </Stack>
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
