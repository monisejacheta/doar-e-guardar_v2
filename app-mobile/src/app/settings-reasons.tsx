// src/app/settings-reasons.tsx
import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const MOTIVOS_HOMOLOGADOS = [
  {
    id: 'Consumo na Cozinha',
    titulo: '🍲 Consumo Diário na Cozinha',
    exigeTravaPerda: false,
    regra: 'Saída normal para o preparo das refeições das crianças (dando preferência ao que vence antes).',
  },
  {
    id: 'Vencimento (Descarte)',
    titulo: '⚠️ Descarte por Vencimento',
    exigeTravaPerda: true,
    regra: 'Usado quando um alimento passa da validade e precisa ser retirado da prateleira.',
  },
  {
    id: 'Avaria / Embalagem Rasgada',
    titulo: '📦 Descarte por Embalagem Danificada',
    exigeTravaPerda: true,
    regra: 'Usado quando o pacote rasga ou estraga e não pode mais ser usado na cozinha.',
  },
];

export default function SettingsReasonsScreen() {
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
          Motivos de Saída
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Veja as opções disponíveis na hora de dar baixa em um alimento do estoque.
        </Text>

        {MOTIVOS_HOMOLOGADOS.map((m) => (
          <View
            key={m.id}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: m.exigeTravaPerda ? theme.danger : theme.secondary,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>{m.titulo}</Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 6 }}>{m.regra}</Text>
            <Text
              style={{
                marginTop: 8,
                fontWeight: '800',
                fontSize: 11 * fontScale,
                color: m.exigeTravaPerda ? theme.danger : theme.secondary,
              }}
            >
              {m.exigeTravaPerda ? '📋 FICA REGISTRADO NO RELATÓRIO DE DESCARTES' : '✅ SAÍDA RÁPIDA PARA USO'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

