// src/app/diagnostic-config.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../services/api';

export default function DiagnosticConfigScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const parametros = [
    { chave: 'Endpoint AWS Lambda', valor: API_BASE_URL },
    { chave: 'Timeout de Requisição HTTP', valor: '15.000 ms (AbortController ativo)' },
    { chave: 'Prioridade 0 (Cache Nuvem)', valor: 'DynamoDB tb_produtos (instantâneo)' },
    { chave: 'Prioridade 1 (API Externa)', valor: 'Open Food Facts BR / World v2 (timeout 5s)' },
    { chave: 'Prioridade 2 (API Externa)', valor: 'Bluesoft Cosmos API (X-Cosmos-Token)' },
    { chave: 'Prioridade 3 (API Fallback)', valor: 'Open Product Data / UPCitemdb Trial' },
    { chave: 'Política de Prateleiras', valor: 'Normalização Canônica US06 (tb_locaisArmazenamento)' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 105 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Diagnóstico"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar ao Diagnóstico
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          Parâmetros e Integrações
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Configurações ativas de comunicação entre o aplicativo mobile e a infraestrutura AWS Serverless.
        </Text>

        {parametros.map((p) => (
          <View
            key={p.chave}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.border,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 13 * fontScale }}>{p.chave}</Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 4 }}>{p.valor}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

