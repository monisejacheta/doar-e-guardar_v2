// src/app/audit-user.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';

export default function AuditUserScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
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

  const porOperador = useMemo(() => {
    const mapa = new Map<string, { usuario: string; totalOperacoes: number; ultimaData: string; itens: any[] }>();
    movimentacoes.forEach((m) => {
      const usr = String(m.id_usuario_responsavel || m.responsavel || 'Operador');
      const dataStr = String(m.data_hora_movimentacao || m.data || '');
      if (!mapa.has(usr)) {
        mapa.set(usr, { usuario: usr, totalOperacoes: 0, ultimaData: dataStr, itens: [] });
      }
      const item = mapa.get(usr)!;
      item.totalOperacoes += 1;
      if (dataStr > item.ultimaData) item.ultimaData = dataStr;
      item.itens.push(m);
    });
    return Array.from(mapa.values()).sort((a, b) => b.totalOperacoes - a.totalOperacoes);
  }, [movimentacoes]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>
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
          Auditoria por Operador
        </Text>
        <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4, marginBottom: 16 }}>
          Histórico de responsabilidade operacional nas entradas, baixas e transferências de prateleira na AWS.
        </Text>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 24 }} />
        ) : porOperador.length === 0 ? (
          <Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 24 }}>
            Nenhuma operação registrada no histórico da AWS.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {porOperador.map((op) => (
              <View
                key={op.usuario}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 1.5,
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Feather name="user-check" size={20} color={theme.primary} />
                    <Text style={{ fontWeight: '800', color: theme.text, fontSize: 14 * fontScale }}>{op.usuario}</Text>
                  </View>
                  <Text style={{ fontWeight: '800', color: theme.secondary, fontSize: 12 * fontScale }}>
                    {op.totalOperacoes} ação(ões)
                  </Text>
                </View>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, marginTop: 6 }}>
                  Última atividade: {(op.ultimaData || '').replace('T', ' ')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
