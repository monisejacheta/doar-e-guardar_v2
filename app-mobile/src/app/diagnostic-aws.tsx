// src/app/diagnostic-aws.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi, API_BASE_URL } from '../services/api';

export default function DiagnosticAwsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [testando, setTestando] = useState(true);
  const [resultados, setResultados] = useState<
    { rota: string; modulo: string; status: string; latenciaMs: number; ok: boolean }[]
  >([]);

  const testarRotasLambda = useCallback(async () => {
    setTestando(true);
    const testes = [
      { rota: '/api/estoque', modulo: 'estoque', acao: 'consultar_estoque', nome: 'Lambda Estoque (/api/estoque)' },
      { rota: '/api/configuracoes', modulo: 'configuracoes', acao: 'listar_locais', nome: 'Lambda Prateleiras (/api/configuracoes)' },
      { rota: '/api/relatorios', modulo: 'relatorios', acao: 'gerar_relatorio', nome: 'Lambda Relatórios (/api/relatorios)' },
    ];

    const lista: { rota: string; modulo: string; status: string; latenciaMs: number; ok: boolean }[] = [];

    for (const t of testes) {
      const inicio = Date.now();
      try {
        const resp: any = await requisicaoApi(t.rota, {
          metodo: 'POST',
          dados: { modulo: t.modulo, acao: t.acao },
        });
        const ms = Date.now() - inicio;
        lista.push({
          rota: t.nome,
          modulo: t.modulo,
          status: resp?.sucesso !== false ? 'ONLINE (HTTP 200)' : 'ATENÇÃO',
          latenciaMs: ms,
          ok: resp?.sucesso !== false,
        });
      } catch (e: any) {
        lista.push({
          rota: t.nome,
          modulo: t.modulo,
          status: e?.message || 'FALHA',
          latenciaMs: Date.now() - inicio,
          ok: false,
        });
      }
    }

    setResultados(lista);
    setTestando(false);
  }, []);

  useEffect(() => {
    testarRotasLambda();
  }, [testarRotasLambda]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
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
          9.1 Funções Serverless AWS Lambda
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Endpoint ativo: {API_BASE_URL}
        </Text>

        {testando ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.subtext, marginTop: 12, fontSize: 13 * fontScale }}>
              Medindo latência real das funções AWS Lambda...
            </Text>
          </View>
        ) : (
          resultados.map((item) => (
            <View
              key={item.rota}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: item.ok ? theme.secondary : theme.danger,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale, flex: 1 }}>
                  {item.rota}
                </Text>
                <Text
                  style={{
                    fontWeight: '800',
                    color: item.ok ? theme.secondary : theme.danger,
                    fontSize: 12 * fontScale,
                  }}
                >
                  {item.latenciaMs} ms
                </Text>
              </View>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4 }}>
                Status: {item.status}
              </Text>
            </View>
          ))
        )}

        <View style={{ marginTop: 12 }}>
          <AppButton title="Executar Novo Ping AWS" variant="primary" loading={testando} onPress={testarRotasLambda} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
