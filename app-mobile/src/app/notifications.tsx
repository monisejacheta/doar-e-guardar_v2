// src/app/notifications.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/common/AppIcon';

export default function NotificationsScreen() {
  const { theme, tokens, fontScale } = useAppTheme();

  const [listaNotificacoes, setListaNotificacoes] = useState([
    {
      id: 'notif-1',
      titulo: '⚠️ Lote Próximo do Vencimento',
      conteudo: 'O lote LOTE-2026-A1 de Leite Integral vence em 4 dias na Geladeira 1.',
      dataHora: 'Hoje, 08:30',
      lido: false,
      cor: tokens.colors.accentAmber500,
    },
    {
      id: 'notif-2',
      titulo: '📉 Estoque Mínimo Atingido',
      conteudo: 'O produto Feijão Carioca 1kg atingiu o nível crítico de segurança.',
      dataHora: 'Ontem, 14:10',
      lido: true,
      cor: theme.danger,
    },
    {
      id: 'notif-3',
      titulo: '🍲 Sugestão da Dora',
      conteudo: 'Temos itens de leite e arroz para aproveitar em receitas anti-desperdício.',
      dataHora: '19/10/2026',
      lido: true,
      cor: theme.secondary,
    },
  ]);

  const marcarComoLida = (id: string) => {
    setListaNotificacoes((anterior) =>
      anterior.map((n) => (n.id === id ? { ...n, lido: true } : n))
    );
    Alert.alert('Notificação Atualizada', 'Aviso marcado como lido.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }}>
            Avisos e Notificações
          </Text>
          <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }}>
            Alertas automáticos gerados pela Dora e pelo sistema de estoque.
          </Text>
        </View>

        {listaNotificacoes.map((item) => (
          <TouchableOpacity
            key={item.id}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.titulo}. ${item.conteudo}. ${item.lido ? 'Lido' : 'Não lido'}`}
            onPress={() => marcarComoLida(item.id)}
            style={{
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 14,
              marginBottom: 12,
              backgroundColor: item.lido ? theme.surface : `${item.cor}10`,
              borderColor: item.lido ? theme.border : item.cor,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold', color: item.cor, fontSize: 14 * fontScale }}>
                {item.titulo}
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>{item.dataHora}</Text>
            </View>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, lineHeight: 18 }}>
              {item.conteudo}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}