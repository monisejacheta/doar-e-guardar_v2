// src/app/diagnostic-aws.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      { rota: '/api/estoque', modulo: 'estoque', acao: 'consultar_estoque', nome: 'Controle de Estoque' },
      { rota: '/api/configuracoes', modulo: 'configuracoes', acao: 'listar_locais', nome: 'Prateleiras e Armários' },
      { rota: '/api/relatorios', modulo: 'relatorios', acao: 'consultar_movimentacoes', nome: 'Relatórios e Histórico' },
      { rota: '/api/auth/login', modulo: 'auth', acao: 'status', nome: 'Acesso e Login' },
      { rota: '/api/dora', modulo: 'dora', acao: 'ping', nome: 'Assistente Dora' },
    ];

    const lista: { rota: string; modulo: string; status: string; latenciaMs: number; ok: boolean }[] = [];

    for (const t of testes) {
      const inicio = Date.now();
      try {
        const resp: any = await requisicaoApi(t.rota, {
          metodo: 'POST',
          dados: { modulo: t.modulo, acao: t.acao },
          timeoutMs: 8000,
        });
        const ms = Date.now() - inicio;
        lista.push({
          rota: t.nome,
          modulo: t.modulo,
          status: resp?.sucesso !== false ? 'Funcionando bem' : 'Atenção',
          latenciaMs: ms,
          ok: resp?.sucesso !== false,
        });
      } catch (e: any) {
        lista.push({
          rota: t.nome,
          modulo: t.modulo,
          status: e?.message || 'Sem resposta no momento',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Status do App"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          Conexão do Aplicativo
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Veja se cada parte do aplicativo está respondendo direitinho.
        </Text>

        {testando ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.subtext, marginTop: 12, fontSize: 13 * fontScale }}>
              Testando a conexão de cada parte do aplicativo...
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
                Situação: {item.status}
              </Text>
            </View>
          ))
        )}

        <View style={{ marginTop: 12 }}>
          <AppButton title="Testar Conexão Novamente" variant="primary" loading={testando} onPress={testarRotasLambda} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
