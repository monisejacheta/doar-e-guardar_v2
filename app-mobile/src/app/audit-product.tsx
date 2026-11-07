// src/app/audit-product.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
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
          Auditoria por Produto
        </Text>
        <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4, marginBottom: 16 }}>
          Rastro completo de entradas, saídas, ajustes e transferências de prateleira por alimento na AWS.
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
            placeholder="Filtrar por nome do produto ou EAN..."
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
            Nenhum rastro de auditoria encontrado para o filtro informado.
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
                  EAN: {prod.ean} • {prod.registros.length} operação(ões) auditada(s)
                </Text>
                {prod.registros.slice(0, 6).map((reg, idx) => (
                  <View
                    key={reg.id_movimentacao || idx}
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: theme.border,
                      paddingTop: 8,
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: theme.primary, fontSize: 12 * fontScale }}>
                      {reg.operacao || reg.tipo_operacao} • {reg.quantidade_movimentada_pacote || reg.qtd} pct(s) (Lote{' '}
                      {reg.numero_codigo_lote || reg.lote})
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>
                      Prateleira: {normalizarDescricaoPrateleira(reg.local_descricao || reg.local)} • Resp:{' '}
                      {reg.id_usuario_responsavel || reg.responsavel}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
