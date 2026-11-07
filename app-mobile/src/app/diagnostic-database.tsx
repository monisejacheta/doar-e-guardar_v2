// src/app/diagnostic-database.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';
import { carregarPrateleirasAws, normalizarDescricaoPrateleira, resolverPrateleiraPorDescricaoOuId } from '../services/storageLocations';
import { auth } from '../services/firebaseConfig';

export default function DiagnosticDatabaseScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [carregando, setCarregando] = useState(true);
  const [metricas, setMetricas] = useState({
    lotesAtivos: 0,
    movimentacoes: 0,
    prateleirasAws: 0,
    discrepanciasPrateleira: 0,
    sessaoFirebase: false,
  });

  const auditarBancos = useCallback(async () => {
    setCarregando(true);
    try {
      const [respEstoque, respMov, resPrateleiras] = await Promise.all([
        requisicaoApi<any>('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        }),
        requisicaoApi<any>('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_movimentacoes' },
        }),
        carregarPrateleirasAws(),
      ]);

      const prateleiras = resPrateleiras.locais;
      const lotes = Array.isArray(respEstoque?.lotes)
        ? respEstoque.lotes.filter((l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0)
        : [];
      const logs = Array.isArray(respMov?.movimentacoes) ? respMov.movimentacoes : [];

      let divergencias = 0;
      lotes.forEach((l: any) => {
        const desc = normalizarDescricaoPrateleira(l.local_descricao || l.id_local_armazenamento || '');
        if (!resolverPrateleiraPorDescricaoOuId(desc, prateleiras)) {
          divergencias += 1;
        }
      });

      setMetricas({
        lotesAtivos: lotes.length,
        movimentacoes: logs.length,
        prateleirasAws: prateleiras.length,
        discrepanciasPrateleira: divergencias,
        sessaoFirebase: Boolean(auth?.currentUser),
      });
    } catch {
      // Ignora erro de rede mantendo estado anterior
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    auditarBancos();
  }, [auditarBancos]);

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
          9.2 Bancos de Dados (AWS + Firebase)
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Inspeção de integridade entre `tb_lotesProdutos`, `tb_locaisArmazenamento` e `tb_movimentacoesEstoques`.
        </Text>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
        ) : (
          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.secondary }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Tabela de Lotes (`tb_lotesProdutos`)
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 4 }}>
                {metricas.lotesAtivos} lotes ativos com saldo positivo na AWS.
              </Text>
            </View>

            <View style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.secondary }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Prateleiras Homologadas (`tb_locaisArmazenamento`)
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 4 }}>
                {metricas.prateleirasAws} prateleiras/compartimentos ativos • {metricas.discrepanciasPrateleira} divergências pendentes.
              </Text>
            </View>

            <View style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.primary }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Histórico de Auditoria (`tb_movimentacoesEstoques`)
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 4 }}>
                {metricas.movimentacoes} registros de entrada, movimentação interna e baixa auditados.
              </Text>
            </View>

            <View style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.border }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Autenticação Firebase Auth
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 4 }}>
                Sessão local: {metricas.sessaoFirebase ? `Autenticado (${auth?.currentUser?.email})` : 'Sessão institucional ativa via API'}
              </Text>
            </View>
          </View>
        )}

        <AppButton title="Revalidar Tabelas na AWS" variant="primary" loading={carregando} onPress={auditarBancos} />
      </ScrollView>
    </SafeAreaView>
  );
}
