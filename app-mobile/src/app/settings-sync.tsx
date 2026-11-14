// src/app/settings-sync.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';
import { carregarPrateleirasAws } from '../services/storageLocations';

export default function SettingsSyncScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [sincronizando, setSincronizando] = useState(true);
  const [resumo, setResumo] = useState({
    lotes: 0,
    prateleiras: 0,
    movimentacoes: 0,
    ultimaSincronizacao: '',
  });

  const executarSincronizacaoAws = useCallback(async (exibirAlerta = false) => {
    setSincronizando(true);
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
      const lotesAtivos = Array.isArray(respEstoque?.lotes)
        ? respEstoque.lotes.filter((l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0).length
        : 0;
      const totalMov = Array.isArray(respMov?.movimentacoes) ? respMov.movimentacoes.length : 0;
      const agora = new Date().toLocaleTimeString('pt-BR');

      setResumo({
        lotes: lotesAtivos,
        prateleiras: prateleiras.length,
        movimentacoes: totalMov,
        ultimaSincronizacao: agora,
      });

      if (exibirAlerta) {
        Alert.alert(
          'Sincronização AWS Concluída',
          `Tabelas DynamoDB conferidas às ${agora}:\n• ${lotesAtivos} lotes ativos\n• ${prateleiras.length} prateleiras homologadas\n• ${totalMov} registros de movimentação`
        );
      }
    } catch (e: any) {
      if (exibirAlerta) {
        Alert.alert('Erro de Sincronização', e?.message || 'Não foi possível comunicar com a AWS.');
      }
    } finally {
      setSincronizando(false);
    }
  }, []);

  useEffect(() => {
    executarSincronizacaoAws(false);
  }, [executarSincronizacaoAws]);

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
          6.8 Backup e Sincronização AWS
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Estado em tempo real das tabelas DynamoDB na nuvem AWS (`us-east-2`).
        </Text>

        {sincronizando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
        ) : (
          <View style={{ backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1.5, borderColor: theme.secondary, padding: 16, marginBottom: 16, gap: 8 }}>
            <Text style={{ fontWeight: 'bold', color: theme.secondary, fontSize: 14 * fontScale }}>
              ☁️ Nuvem AWS Sincronizada ({resumo.ultimaSincronizacao})
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale }}>
              • Lotes ativos em `tb_lotesProdutos`: <Text style={{ fontWeight: 'bold' }}>{resumo.lotes}</Text>
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale }}>
              • Prateleiras homologadas em `tb_locaisArmazenamento`: <Text style={{ fontWeight: 'bold' }}>{resumo.prateleiras}</Text>
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale }}>
              • Eventos auditados em `tb_movimentacoesEstoques`: <Text style={{ fontWeight: 'bold' }}>{resumo.movimentacoes}</Text>
            </Text>
          </View>
        )}

        <AppButton
          title="Sincronizar Agora com a AWS"
          variant="primary"
          loading={sincronizando}
          onPress={() => executarSincronizacaoAws(true)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

