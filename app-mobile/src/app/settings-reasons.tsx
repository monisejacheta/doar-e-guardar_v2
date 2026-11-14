// src/app/settings-reasons.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const MOTIVOS_HOMOLOGADOS = [
  {
    id: 'Consumo na Cozinha',
    titulo: '🍲 Consumo Diário na Cozinha',
    exigeTravaPerda: false,
    regra: 'Baixa operacional padrão para preparo de refeições das crianças (prioridade FEFO).',
  },
  {
    id: 'Vencimento (Descarte)',
    titulo: '⚠️ Descarte por Vencimento (US07)',
    exigeTravaPerda: true,
    regra: 'Exige confirmação explícita digitando PERDA e registra alerta no Relatório de Perdas e Descartes.',
  },
  {
    id: 'Avaria / Embalagem Rasgada',
    titulo: '📦 Descarte por Avaria ou Violação (US07)',
    exigeTravaPerda: true,
    regra: 'Exige confirmação explícita digitando PERDA para rastreabilidade em auditoria.',
  },
];

export default function SettingsReasonsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
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
          6.7 Motivos de Saída (US07)
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Justificativas oficiais exigidas na tela de Dar Baixa (`stock-remove`) e auditadas na AWS.
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
              {m.exigeTravaPerda ? '🔒 TRAVA DE SEGURANÇA "PERDA" ATIVA' : '✅ FLUXO RÁPIDO DE CONSUMO'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

