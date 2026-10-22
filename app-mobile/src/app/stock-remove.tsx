// app-mobile/src/app/stock-remove.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { AppInput } from '../components/common/AppInput';
import { AppIcon } from '../components/common/AppIcon';
import { estilosStockRemove } from '../styles/stock-remove.styles';
import { requisicaoApi } from '../services/api';
import { auth } from '../services/firebaseConfig';

interface LoteItem {
  id_lote_produto: string;
  id_produto: string;
  nome_produto: string;
  codigo_barra_produto: string;
  numero_codigo_lote: string;
  quantidade_atual_pacote: number;
  data_validade_lote: string;
  status_validade_lote: string;
  local_descricao: string;
  categoria?: string;
}

export default function StockRemoveScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoBaixa, setProcessandoBaixa] = useState(false);

  const [loteSelecionadoId, setLoteSelecionadoId] = useState<string>('');
  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  const [motivoSaida, setMotivoSaida] = useState('saída para consumo');
  const [justificativa, setJustificativa] = useState('');
  const [palavraTravaPerda, setPalavraTravaPerda] = useState('');

  const motivosDisponiveis = [
    'saída para consumo',
    'perda - descarte vencido',
    'perda - descarte',
    'saída - outro motivo',
  ];

  // Carrega os lotes reais persistidos no DynamoDB
  const carregarLotesReais = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        setLotes(resposta.lotes);
        if (resposta.lotes.length > 0) {
          setLoteSelecionadoId(resposta.lotes[0].id_lote_produto);
        }
      }
    } catch (erro: any) {
      Alert.alert('Erro ao carregar lotes', erro.message || 'Falha na comunicação com o DynamoDB.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarLotesReais();
  }, [carregarLotesReais]);

  const loteAtual = lotes.find((l) => l.id_lote_produto === loteSelecionadoId) || lotes[0];
  const ehDescartePorPerda = motivoSaida.toLowerCase().includes('perda');
  const ehPrimeiroLote = lotes.length > 0 && loteSelecionadoId === lotes[0].id_lote_produto;

  const selecionarLote = (lote: LoteItem) => {
    setLoteSelecionadoId(lote.id_lote_produto);
    if (lotes.length > 0 && lote.id_lote_produto !== lotes[0].id_lote_produto) {
      Alert.alert(
        'Atenção ao Vencimento (FEFO)',
        `O lote "${lotes[0].numero_codigo_lote}" vence antes (${lotes[0].data_validade_lote}) e deve ser priorizado para evitar perdas.`
      );
    }
  };

  const confirmarBaixa = async () => {
    if (!loteAtual) {
      Alert.alert('Erro', 'Nenhum lote selecionado.');
      return;
    }

    const qtd = Number(quantidadeSaida);

    if (!quantidadeSaida || isNaN(qtd) || qtd <= 0) {
      Alert.alert('Quantidade Inválida', 'Informe quantos pacotes deseja dar baixa.');
      return;
    }

    if (qtd > loteAtual.quantidade_atual_pacote) {
      Alert.alert(
        'Saldo Insuficiente',
        `Você tentou retirar ${qtd} pacotes, mas este lote possui apenas ${loteAtual.quantidade_atual_pacote} disponíveis.`
      );
      return;
    }

    if (ehDescartePorPerda) {
      if (palavraTravaPerda.trim() !== 'PERDA') {
        Alert.alert(
          'Trava de Segurança Ativa',
          'Para autorizar a perda ou descarte de alimentos, digite a palavra "PERDA" em letras maiúsculas.'
        );
        return;
      }
      if (!justificativa.trim()) {
        Alert.alert('Justificativa Obrigatória', 'Descreva o motivo do descarte ou avaria.');
        return;
      }
    }

    setProcessandoBaixa(true);
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'remover_estoque',
          id_lote_produto: loteAtual.id_lote_produto,
          quantidade: qtd,
          motivo_saida: motivoSaida,
          palavra_confirmacao: palavraTravaPerda,
          justificativa: justificativa,
          id_usuario: auth.currentUser?.email || auth.currentUser?.uid || 'operador',
        },
      });

      if (resposta?.sucesso) {
        Alert.alert(
          'Baixa Concluída!',
          `Operação salva no DynamoDB:\n• Produto: ${loteAtual.nome_produto}\n• Lote: ${loteAtual.numero_codigo_lote}\n• Quantidade: ${qtd} pcts\n• Novo saldo: ${resposta.novo_saldo} pcts`,
          [{ text: 'Concluir', onPress: () => roteador.back() }]
        );
      } else {
        Alert.alert('Falha na Operação', resposta?.mensagem || 'Não foi possível registrar a baixa.');
      }
    } catch (erro: any) {
      Alert.alert('Erro de Conexão', erro.message || 'Falha ao processar requisição na nuvem.');
    } finally {
      setProcessandoBaixa(false);
    }
  };

  return (
    <SafeAreaView style={[estilosStockRemove.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockRemove.rolagem} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho */}
        <View style={estilosStockRemove.cabecalho}>
          <Text
            style={[
              estilosStockRemove.titulo,
              { color: theme.danger, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Saída / Baixa de Alimentos
          </Text>
          <Text
            style={[
              estilosStockRemove.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            Retirada para refeições ou descarte por validade com trava de segurança.
          </Text>
        </View>

        {carregando ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: 8, color: theme.subtext }}>Buscando lotes no DynamoDB...</Text>
          </View>
        ) : lotes.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: theme.subtext }}>Nenhum lote disponível no estoque.</Text>
          </View>
        ) : (
          <>
            {/* 1. Seleção do Lote com Priorização FEFO */}
            <View
              style={[
                estilosStockRemove.secaoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  estilosStockRemove.tituloSecaoCard,
                  { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
                ]}
              >
                1. Selecione o Lote do Produto
              </Text>

              {!ehPrimeiroLote && (
                <View
                  style={[
                    estilosStockRemove.alertaFefo,
                    {
                      backgroundColor: `${tokens.colors.accentAmber500}15`,
                      borderColor: tokens.colors.accentAmber500,
                    },
                  ]}
                >
                  <AppIcon name="alert-triangle" size={18} variant="amber" />
                  <Text style={[estilosStockRemove.textoAlertaFefo, { color: theme.text }]}>
                    Aviso: O lote {lotes[0].numero_codigo_lote} vence antes e deve ser priorizado.
                  </Text>
                </View>
              )}

              {lotes.map((item) => {
                const selecionado = item.id_lote_produto === loteSelecionadoId;
                const critico = item.status_validade_lote === 'próximo do vencimento';

                return (
                  <TouchableOpacity
                    key={item.id_lote_produto}
                    onPress={() => selecionarLote(item)}
                    style={[
                      estilosStockRemove.cartaoLote,
                      {
                        backgroundColor: selecionado ? `${theme.primary}15` : theme.background,
                        borderColor: selecionado
                          ? theme.primary
                          : critico
                          ? tokens.colors.accentAmber500
                          : theme.border,
                      },
                    ]}
                  >
                    <View style={estilosStockRemove.infoLote}>
                      <Text style={[estilosStockRemove.nomeLote, { color: theme.text }]}>
                        {item.nome_produto} • {item.numero_codigo_lote}
                      </Text>
                      <Text style={[estilosStockRemove.detalheLote, { color: theme.subtext }]}>
                        Validade: {item.data_validade_lote} • Local: {item.local_descricao}
                      </Text>
                    </View>
                    <View style={estilosStockRemove.saldoLote}>
                      <Text style={{ fontWeight: 'bold', color: theme.primary }}>
                        {item.quantidade_atual_pacote} pcts
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.subtext }}>disponíveis</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Quantidade e Motivo da Baixa */}
            <View
              style={[
                estilosStockRemove.secaoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  estilosStockRemove.tituloSecaoCard,
                  { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
                ]}
              >
                2. Quantidade e Motivo da Saída
              </Text>

              <AppInput
                rotulo={`Quantidade a retirar (Disponível no lote: ${loteAtual.quantidade_atual_pacote})`}
                placeholder={`Máx: ${loteAtual.quantidade_atual_pacote}`}
                keyboardType="numeric"
                value={quantidadeSaida}
                onChangeText={setQuantidadeSaida}
              />

              <Text style={{ fontWeight: '600', color: theme.text, marginBottom: 8, marginTop: 4 }}>
                Motivo da Saída:
              </Text>
              <View style={estilosStockRemove.gradeMotivos}>
                {motivosDisponiveis.map((mot) => (
                  <TouchableOpacity
                    key={mot}
                    onPress={() => setMotivoSaida(mot)}
                    style={[
                      estilosStockRemove.botaoMotivo,
                      {
                        backgroundColor: motivoSaida === mot ? `${theme.primary}15` : theme.background,
                        borderColor: motivoSaida === mot ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        estilosStockRemove.textoMotivo,
                        { color: motivoSaida === mot ? theme.primary : theme.text },
                      ]}
                    >
                      {mot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                rotulo="Justificativa / Observações"
                placeholder="Ex: Almoço das crianças / Embalagem rasgada"
                value={justificativa}
                onChangeText={setJustificativa}
              />
            </View>

            {/* 3. Trava de Proteção Obrigatória (PERDA) */}
            {ehDescartePorPerda && (
              <View
                style={[
                  estilosStockRemove.blocoTravaPerda,
                  { backgroundColor: `${theme.danger}10`, borderColor: theme.danger },
                ]}
              >
                <Text
                  style={[
                    estilosStockRemove.textoAvisoPerda,
                    { color: theme.danger, fontSize: tokens.typography.fontSize.sm * fontScale },
                  ]}
                >
                  🔒 Trava de Segurança para Descarte
                </Text>
                <Text style={[estilosStockRemove.instrucaoPerda, { color: theme.text }]}>
                  Digite exatamente a palavra{' '}
                  <Text style={{ fontWeight: 'bold', color: theme.danger }}>PERDA</Text> em maiúsculas:
                </Text>

                <AppInput
                  rotulo="Confirmação de segurança:"
                  placeholder="Digite PERDA aqui"
                  autoCapitalize="characters"
                  value={palavraTravaPerda}
                  onChangeText={setPalavraTravaPerda}
                />
              </View>
            )}

            {/* Botão de Envio com indicador de carregamento */}
            {processandoBaixa ? (
              <ActivityIndicator size="small" color={theme.danger} style={{ marginTop: 8 }} />
            ) : (
              <AppButton
                title={ehDescartePorPerda ? 'Confirmar Descarte por Perda' : 'Confirmar Saída do Estoque'}
                variant="danger"
                onPress={confirmarBaixa}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}