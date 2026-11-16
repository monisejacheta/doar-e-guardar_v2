// src/app/audit-period.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';

export default function AuditPeriodScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [diasFiltro, setDiasFiltro] = useState<number>(7);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    requisicaoApi('/api/estoque', {
      metodo: 'POST',
      dados: { modulo: 'estoque', acao: 'consultar_movimentacoes' },
    })
      .then((resp: any) => {
        if (resp?.sucesso && Array.isArray(resp.movimentacoes)) {
          setMovimentacoes(resp.movimentacoes);
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const filtradas = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - diasFiltro);
    return movimentacoes.filter((m) => {
      const dtStr = String(m.data_hora_movimentacao || m.data || '').split('T')[0];
      if (!dtStr) return true;
      const dt = new Date(`${dtStr}T00:00:00`);
      return isNaN(dt.getTime()) || dt >= limite;
    });
  }, [movimentacoes, diasFiltro]);

  const formatarRotuloOperacao = (m: any): { rotulo: string; cor: string } => {
    const opNorm = String(m.operacao || m.tipo_operacao || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const motivoNorm = String(m.motivo_saida || m.motivo || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const localBruto = String(m.local_descricao || m.local || '');

    if (
      opNorm.includes('movimenta') ||
      opNorm.includes('transfer') ||
      motivoNorm.includes('movimenta') ||
      motivoNorm.includes('transfer') ||
      localBruto.includes('→')
    ) {
      return { rotulo: 'Movimentação Interna', cor: theme.primary };
    }
    if (opNorm.includes('perda') || motivoNorm.includes('perda') || motivoNorm.includes('descarte')) {
      return { rotulo: 'Saída (Perda / Descarte)', cor: theme.danger };
    }
    if (opNorm.includes('saida') || opNorm.includes('baixa') || motivoNorm.includes('saida')) {
      return { rotulo: 'Saída', cor: theme.danger };
    }
    if (opNorm.includes('ajuste')) {
      return { rotulo: 'Ajuste de Contagem', cor: '#D97706' };
    }
    return { rotulo: 'Entrada', cor: theme.secondary };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: '700', marginLeft: 8, fontSize: 15 * fontScale }}>Voltar</Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }}>
          Histórico por Período
        </Text>
        <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4, marginBottom: 16 }}>
          Filtre as movimentações da despensa pelos últimos dias ou meses.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {[7, 30, 90, 365].map((dias) => {
            const ativo = diasFiltro === dias;
            return (
              <TouchableOpacity
                key={dias}
                accessible={true}
                accessibilityRole="button"
                onPress={() => setDiasFiltro(dias)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  alignItems: 'center',
                  backgroundColor: ativo ? theme.primary : theme.surface,
                  borderColor: ativo ? theme.primary : theme.border,
                }}
              >
                <Text style={{ fontWeight: '700', color: ativo ? '#FFFFFF' : theme.text, fontSize: 12 * fontScale }}>
                  {dias === 365 ? '1 Ano' : `${dias} dias`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 24 }} />
        ) : (
          <View
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <Text style={{ fontWeight: '800', color: theme.text, fontSize: 14 * fontScale, marginBottom: 10 }}>
              {filtradas.length} registro(s) nos últimos {diasFiltro} dias
            </Text>
            {filtradas.map((m, i) => {
              const infoOp = formatarRotuloOperacao(m);
              return (
                <View
                  key={m.id_movimentacao || m.id_movimentacao_estoque || i}
                  style={{
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: theme.border,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontWeight: '700', color: theme.text, fontSize: 13 * fontScale, flexShrink: 1 }}>
                    {m.nome_produto || m.nome}{' '}
                    <Text style={{ color: infoOp.cor, fontWeight: '800' }}>({infoOp.rotulo})</Text>
                  </Text>
                  <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, marginTop: 2, flexShrink: 1 }}>
                    {String(m.data_hora_movimentacao || m.data || '').replace('T', ' ')} •{' '}
                    {m.quantidade_movimentada_pacote || m.qtd} pct(s)
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
