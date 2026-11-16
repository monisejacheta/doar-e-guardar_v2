// src/app/settings-users.tsx
import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const PERFIS_ACESSO = [
  {
    papel: 'Coordenação / Diretoria',
    permissoes: 'Acesso completo: relatórios, histórico, cadastro de prateleiras e acompanhamento das campanhas.',
  },
  {
    papel: 'Equipe de Estoque e Cozinha',
    permissoes: 'Entrada de alimentos pelo código de barras, mudança de prateleira e baixa de uso diário.',
  },
  {
    papel: 'Voluntários de Apoio',
    permissoes: 'Conferência de prazos de validade, leitura de códigos de barras e conversa com a Dora.',
  },
];

export default function SettingsUsersScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
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
          Equipe e Funções
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Veja como organizamos as funções de cada pessoa que usa o aplicativo na Casa da Criança.
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

