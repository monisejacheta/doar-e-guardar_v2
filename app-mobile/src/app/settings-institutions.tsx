// src/app/settings-institutions.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const INSTITUICOES_PARCEIRAS = [
  { nome: 'Banco de Alimentos Municipal', modalidade: 'Repasse Mensal de Grãos e Laticínios' },
  { nome: 'Rede de Supermercados Parceiros', modalidade: 'Doação de Perecíveis e Mercearia (FEFO)' },
  { nome: 'CONAB / Programa de Aquisição de Alimentos', modalidade: 'Abastecimento Institucional' },
];

export default function SettingsInstitutionsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 105 }}>
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
          6.2 Instituições Parceiras
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Entidades jurídicas homologadas para fornecimento solidário à Casa da Criança.
        </Text>

        {INSTITUICOES_PARCEIRAS.map((inst) => (
          <View
            key={inst.nome}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.border,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>{inst.nome}</Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4 }}>{inst.modalidade}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

