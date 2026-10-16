// src/app/notifications.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { estilosNotificacoes } from '../styles/notifications.styles';

interface NotificacaoItem {
  id: string;
  tipo: 'alerta_validade' | 'estoque_baixo' | 'dora' | 'sistema';
  titulo: string;
  mensagem: string;
  dataHora: string;
  lida: boolean;
  rotaDestino?: string;
}

export default function NotificationsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  // Dados preliminares de notificações recebidas pelo sistema e pela Dora
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([
    {
      id: '1',
      tipo: 'alerta_validade',
      titulo: 'Alimento próximo do vencimento',
      mensagem: 'O lote de Leite Integral vence em menos de 5 dias. Priorize o consumo ou a doação deste item.',
      dataHora: 'Hoje, 09:30',
      lida: false,
    },
    {
      id: '2',
      tipo: 'estoque_baixo',
      titulo: 'Estoque mínimo atingido',
      mensagem: 'O estoque de Feijão Carioca está com apenas 4 pacotes restantes na despensa.',
      dataHora: 'Ontem, 16:15',
      lida: false,
    },
    {
      id: '3',
      tipo: 'dora',
      titulo: 'Dica da Dora',
      mensagem: 'Temos legumes e arroz sobrando com vencimento próximo. Quer uma sugestão de receita de risoto para o almoço?',
      dataHora: 'Ontem, 11:00',
      lida: true,
    },
  ]);

  const alternarLeitura = (id: string) => {
    setNotificacoes((anteriores) =>
      anteriores.map((item) =>
        item.id === id ? { ...item, lida: !item.lida } : item
      )
    );
  };

  const abrirConfiguracoes = () => {
    Alert.alert(
      'Tela 2.2.2 - Configurar Notificações',
      'Aqui o usuário poderá ligar ou desligar avisos de validade, estoque baixo e recados da Dora.'
    );
  };

  const getCorTipo = (tipo: NotificacaoItem['tipo']) => {
    switch (tipo) {
      case 'alerta_validade':
        return tokens.colors.accentAmber500; // Âmbar FEFO < 7 dias
      case 'estoque_baixo':
        return theme.danger; // Vermelho Alerta
      case 'dora':
        return theme.secondary; // Verde Doar
      default:
        return theme.primary; // Azul Guardar
    }
  };

  const getIconeTipo = (tipo: NotificacaoItem['tipo']) => {
    switch (tipo) {
      case 'alerta_validade':
        return '⏳';
      case 'estoque_baixo':
        return '📉';
      case 'dora':
        return '💡';
      default:
        return '🔔';
    }
  };

  return (
    <SafeAreaView style={[estilosNotificacoes.container, { backgroundColor: theme.background }]}>
      {/* Barra superior de ações */}
      <View style={[estilosNotificacoes.barraAcoesTopo, { borderBottomColor: theme.border }]}>
        <Text style={[estilosNotificacoes.textoContador, { color: theme.text, fontSize: 14 * fontScale }]}>
          {notificacoes.filter((n) => !n.lida).length} aviso(s) não lido(s)
        </Text>

        {/* Atalho para Tela 2.2.2 - Configurações */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Abrir configurações de notificações"
          accessibilityHint="Permite escolher quais avisos você deseja receber no celular"
          onPress={abrirConfiguracoes}
          style={[estilosNotificacoes.botaoConfigurar, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
          <Text style={[estilosNotificacoes.textoBotaoConfig, { color: theme.primary, fontSize: 13 * fontScale }]}>
            Preferências
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={estilosNotificacoes.rolagem}>
        {notificacoes.length === 0 ? (
          <View style={estilosNotificacoes.areaVazia}>
            <Text style={{ fontSize: 32 }}>✨</Text>
            <Text style={[estilosNotificacoes.textoVazio, { color: theme.subtext, fontSize: 14 * fontScale }]}>
              Nenhum aviso novo no momento. Tudo em ordem por aqui!
            </Text>
          </View>
        ) : (
          notificacoes.map((item) => {
            const corBorda = getCorTipo(item.tipo);
            return (
              <TouchableOpacity
                key={item.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.titulo}. ${item.mensagem}. Recebido ${item.dataHora}. ${item.lida ? 'Já lido' : 'Não lido'}`}
                accessibilityHint="Toque para alternar o status de leitura deste aviso"
                activeOpacity={0.85}
                onPress={() => alternarLeitura(item.id)}
                style={[
                  estilosNotificacoes.cartaoAviso,
                  {
                    backgroundColor: item.lida ? theme.surface : theme.background,
                    borderColor: item.lida ? theme.border : corBorda,
                  },
                ]}
              >
                <View style={estilosNotificacoes.cabecalhoAviso}>
                  <View style={[estilosNotificacoes.areaIcone, { backgroundColor: `${corBorda}20` }]}>
                    <Text style={estilosNotificacoes.iconeTexto}>{getIconeTipo(item.tipo)}</Text>
                  </View>
                  <Text
                    style={[
                      estilosNotificacoes.tituloAviso,
                      {
                        color: theme.text,
                        fontSize: tokens.typography.fontSize.sm * fontScale,
                      },
                    ]}
                  >
                    {item.titulo}
                  </Text>
                  {!item.lida && (
                    <View style={[estilosNotificacoes.pontoNaoLido, { backgroundColor: corBorda }]} />
                  )}
                </View>

                <Text
                  style={[
                    estilosNotificacoes.mensagemAviso,
                    {
                      color: theme.subtext,
                      fontSize: tokens.typography.fontSize.xs * fontScale,
                    },
                  ]}
                >
                  {item.mensagem}
                </Text>

                <View style={[estilosNotificacoes.rodapeAviso, { borderTopColor: theme.border }]}>
                  <Text
                    style={[
                      estilosNotificacoes.dataHora,
                      {
                        color: theme.subtext,
                        fontSize: 11 * fontScale,
                      },
                    ]}
                  >
                    {item.dataHora}
                  </Text>
                  <Text
                    style={[
                      estilosNotificacoes.textoLink,
                      {
                        color: theme.primary,
                        fontSize: 12 * fontScale,
                      },
                    ]}
                  >
                    {item.lida ? 'Marcar como não lido' : 'Marcar como lido'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}