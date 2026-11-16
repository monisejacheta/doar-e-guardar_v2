// src/app/audit-product.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';

export default function AuditProductScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
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

  const agrupadoPorProduto = useMemo(() => {
    const mapa = new Map<string, { nome: string; ean: string; registros: any[] }>();
    movimentacoes.forEach((m) => {
      const nome = String(m.nome_produto || m.nome || 'Produto');
      const ean = String(m.codigo_barra_produto || m.ean || nome);
      if (!mapa.has(ean)) {
        mapa.set(ean, { nome, ean, registros: [] });
      }
      mapa.get(ean)!.registros.push(m);
    });
    const termo = busca.toLowerCase().trim();
    return Array.from(mapa.values()).filter(
      (p) => !termo || p.nome.toLowerCase().includes(termo) || p.ean.toLowerCase().includes(termo)
    );
  }, [movimentacoes, busca]);

  const formatarRotuloOperacao = (reg: any): { rotulo: string; cor: string } => {
    const opNorm = String(reg.operacao || reg.tipo_operacao || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const motivoNorm = String(reg.motivo_saida || reg.motivo || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const localBruto = String(reg.local_descricao || reg.local || '');

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
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
          Histórico por Produto
        </Text>
        <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4, marginBottom: 16 }}>
          Veja todas as entradas, saídas, ajustes e mudanças de prateleira de cada alimento.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1.5,
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 16,
            minHeight: 48,
          }}
        >
          <Feather name="search" size={16} color={theme.subtext} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Filtrar por nome do alimento ou código..."
            placeholderTextColor={theme.subtext}
            value={busca}
            onChangeText={setBusca}
            style={{ flex: 1, color: theme.text, fontSize: 13 * fontScale }}
          />
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 24 }} />
        ) : agrupadoPorProduto.length === 0 ? (
          <Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 24 }}>
            Nenhum registro encontrado para essa busca.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {agrupadoPorProduto.map((prod) => (
              <View
                key={prod.ean}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 1.5,
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <Text style={{ fontWeight: '800', color: theme.text, fontSize: 14 * fontScale }}>{prod.nome}</Text>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, marginBottom: 8 }}>
                  Código: {prod.ean} • {prod.registros.length} movimentação(ões)
                </Text>
                {prod.registros.slice(0, 6).map((reg, idx) => {
                  const infoOp = formatarRotuloOperacao(reg);
                  return (
                    <View
                      key={reg.id_movimentacao || reg.id_movimentacao_estoque || idx}
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: theme.border,
                        paddingTop: 8,
                        marginTop: 6,
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: infoOp.cor, fontSize: 12 * fontScale, flexShrink: 1 }}>
                        {infoOp.rotulo} • {reg.quantidade_movimentada_pacote || reg.qtd} pct(s) (Lote{' '}
                        {reg.numero_codigo_lote || reg.lote})
                      </Text>
                      <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, flexShrink: 1 }}>
                        Prateleira: {normalizarDescricaoPrateleira(reg.local_descricao || reg.local)} • Resp:{' '}
                        {reg.id_usuario_responsavel || reg.responsavel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
