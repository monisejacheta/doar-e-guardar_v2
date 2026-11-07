// src/app/settings-users.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const PERFIS_ACESSO = [
  {
    papel: 'Administrador / Diretoria',
    permissoes: 'Acesso total: relatórios PDF, auditoria, cadastro/exclusão de prateleiras AWS e moderação web.',
  },
  {
    papel: 'Operador de Estoque / Cozinha',
    permissoes: 'Entrada de produtos via código de barras, transferência entre prateleiras e baixa FEFO.',
  },
  {
    papel: 'Voluntário de Triagem',
    permissoes: 'Conferência de validades, leitura de EAN e consulta à Assistente Dora.',
  },
];

export default function SettingsUsersScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Configurações"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar às Configurações
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          6.6 Usuários e Permissões
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Política de controle de acesso baseado em papéis (RBAC) da Casa da Criança.
        </Text>

        {PERFIS_ACESSO.map((p) => (
          <View
            key={p.papel}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.border,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 14 * fontScale }}>{p.papel}</Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 6 }}>{p.permissoes}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
