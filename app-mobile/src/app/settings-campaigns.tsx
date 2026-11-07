// src/app/settings-campaigns.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const CAMPANHAS_ATIVAS = [
  {
    titulo: 'Arrecadação de Leite Integral UHT e Leite em Pó',
    meta: 'Prioridade Nutricional Infantil',
    moderacao: 'Homologada pela Diretoria (Regra W08)',
  },
  {
    titulo: 'Campanha Cesta Básica Solidária (Arroz, Feijão e Óleo)',
    meta: 'Reposição de Estoque Seco',
    moderacao: 'Homologada pela Diretoria (Regra W08)',
  },
];

export default function SettingsCampaignsScreen() {
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
          6.3 Campanhas de Doações Ativas
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Campanhas públicas visíveis no Portal Web após aprovação administrativa (W08).
        </Text>

        {CAMPANHAS_ATIVAS.map((c) => (
          <View
            key={c.titulo}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.secondary,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>{c.titulo}</Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4 }}>Foco: {c.meta}</Text>
            <Text style={{ color: theme.secondary, fontSize: 12 * fontScale, fontWeight: '700', marginTop: 6 }}>
              ✅ {c.moderacao}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
