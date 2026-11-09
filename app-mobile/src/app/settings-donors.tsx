// src/app/settings-donors.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const DOADORES_CADASTRADOS = [
  { nome: 'Comunidade Paroquial Local', tipo: 'Apoiador Recorrente', statusLgpd: 'Dados Protegidos (LGPD)' },
  { nome: 'Famílias Voluntárias - Sabará', tipo: 'Pessoa Física', statusLgpd: 'Anonimização Disponível' },
  { nome: 'Doação Anônima Direta (Portaria)', tipo: 'Balcão / Recepção', statusLgpd: 'Registro Anonimizado' },
];

export default function SettingsDonorsScreen() {
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
          6.1 Doadores e Conformidade LGPD
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Origens de doação pessoa física integradas ao Portal Web com proteção de dados pessoais (LGPD).
        </Text>

        {DOADORES_CADASTRADOS.map((d) => (
          <View
            key={d.nome}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.border,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>{d.nome}</Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4 }}>Modalidade: {d.tipo}</Text>
            <Text style={{ color: theme.secondary, fontSize: 12 * fontScale, fontWeight: '700', marginTop: 4 }}>
              🛡️ {d.statusLgpd}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

