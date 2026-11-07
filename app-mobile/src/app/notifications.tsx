// src/app/notifications.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';

interface ItemNotificacao {
  id: string;
  titulo: string;
  conteudo: string;
  dataHora: string;
  lido: boolean;
  cor: string;
  rotaDestino?: string;
}

export default function NotificationsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [carregando, setCarregando] = useState(true);
  const [listaNotificacoes, setListaNotificacoes] = useState<ItemNotificacao[]>([]);

  const calcularDiasAteVencimento = (dataIso?: string): number => {
    if (!dataIso) return 999;
    const partes = String(dataIso).split('T')[0].split('-');
    if (partes.length !== 3) return 999;
    const [ano, mes, dia] = partes.map(Number);
    const dataVal = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const carregarAlertasReaisAws = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      const alertas: ItemNotificacao[] = [];

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        const ativos = resposta.lotes.filter((l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0);

        ativos.forEach((l: any) => {
          const dias = calcularDiasAteVencimento(l.data_validade_rotulo);
          const prateleira = normalizarDescricaoPrateleira(
            l.local_descricao || l.id_local_armazenamento || 'Sem Local Definido'
          );
          const qtd = Number(l.quantidade_atual_pacote) || 0;
          const min = Number(l.estoque_minimo_pacote) || 5;

          if (dias < 0) {
            alertas.push({
              id: `vencido-${l.id_lote_produto || l.numero_codigo_lote}`,
              titulo: '🚨 Lote Vencido no Estoque',
              conteudo: `O lote ${l.numero_codigo_lote} de ${l.nome_produto} (${qtd} un.) está vencido há ${Math.abs(dias)} dia(s) em "${prateleira}".`,
              dataHora: 'Prioridade Máxima',
              lido: false,
              cor: theme.danger,
              rotaDestino: '/stock-remove',
            });
          } else if (dias <= 15) {
            alertas.push({
              id: `vence-${l.id_lote_produto || l.numero_codigo_lote}`,
              titulo: '⚠️ Lote Próximo do Vencimento (FEFO)',
              conteudo: `O lote ${l.numero_codigo_lote} de ${l.nome_produto} (${qtd} un.) vence em ${dias} dia(s) na prateleira "${prateleira}".`,
              dataHora: 'Alerta Preventivo',
              lido: false,
              cor: tokens.colors.accentAmber500,
              rotaDestino: '/dora',
            });
          }

          if (qtd <= min) {
            alertas.push({
              id: `min-${l.id_lote_produto || l.numero_codigo_lote}`,
              titulo: '📉 Estoque Mínimo Atingido',
              conteudo: `${l.nome_produto} possui apenas ${qtd} un. em "${prateleira}" (mínimo: ${min} un.).`,
              dataHora: 'Reposição',
              lido: true,
              cor: theme.primary,
              rotaDestino: '/stock',
            });
          }
        });
      }

      if (alertas.length === 0) {
        alertas.push({
          id: 'notif-ok',
          titulo: '✅ Estoque Regularizado na AWS',
          conteudo: 'Não há lotes vencidos ou em estado crítico nas prateleiras cadastradas.',
          dataHora: 'Sincronizado agora',
          lido: true,
          cor: theme.secondary,
        });
      }

      setListaNotificacoes(alertas);
    } catch {
      setListaNotificacoes([
        {
          id: 'notif-offline',
          titulo: '⚠️ Sem Conexão com a Nuvem AWS',
          conteudo: 'Toque em atualizar para sincronizar os alertas reais das prateleiras.',
          dataHora: 'Agora',
          lido: false,
          cor: theme.danger,
        },
      ]);
    } finally {
      setCarregando(false);
    }
  }, [theme.danger, theme.primary, theme.secondary, tokens.colors.accentAmber500]);

  useEffect(() => {
    carregarAlertasReaisAws();
  }, [carregarAlertasReaisAws]);

  const marcarComoLida = (item: ItemNotificacao) => {
    setListaNotificacoes((anterior) =>
      anterior.map((n) => (n.id === item.id ? { ...n, lido: true } : n))
    );
    if (item.rotaDestino) {
      roteador.push(item.rotaDestino as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
            onPress={() => roteador.back()}
            style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}
          >
            <Feather name="arrow-left" size={20} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
              Voltar
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Configurar alertas"
              onPress={() => roteador.push('/notifications-config' as any)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 * fontScale }}>Ajustes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Atualizar alertas AWS"
              onPress={carregarAlertasReaisAws}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Feather name="refresh-cw" size={14} color={theme.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }}>
            Avisos e Notificações
          </Text>
          <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }}>
            Alertas gerados em tempo real a partir dos lotes e prateleiras na AWS.
          </Text>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
        ) : (
          listaNotificacoes.map((item) => (
            <TouchableOpacity
              key={item.id}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${item.titulo}. ${item.conteudo}. ${item.lido ? 'Lido' : 'Não lido'}`}
              onPress={() => marcarComoLida(item)}
              style={{
                borderWidth: 1.5,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                backgroundColor: item.lido ? theme.surface : `${item.cor}12`,
                borderColor: item.lido ? theme.border : item.cor,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold', color: item.cor, fontSize: 14 * fontScale, flex: 1 }}>
                  {item.titulo}
                </Text>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>{item.dataHora}</Text>
              </View>
              <Text style={{ color: theme.text, fontSize: 13 * fontScale, lineHeight: 19 }}>
                {item.conteudo}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
