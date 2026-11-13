import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosDora } from '../styles/dora.styles';
import { requisicaoApi } from '../services/api';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';
import {
  AtalhoNavegacaoDora,
  LoteEstoqueDora,
  MovimentacaoEstoqueDora,
  PredicaoProdutoML,
  ReceitaSugerida,
  calcularDiasAteVencimento,
  responderConversaDora,
} from '../services/doraService';

const AVATAR_DORA_ASSET = require('../../assets/images/dora-avatar.png');

interface MensagemChat {
  id: string;
  autor: 'dora' | 'usuario';
  horario: string;
  texto: string;
  receita?: ReceitaSugerida;
  predicoes?: PredicaoProdutoML[];
  atalho?: AtalhoNavegacaoDora;
  sugestoesContinuacao?: string[];
}

const obterHorarioAtual = (): string => {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
};

const criarMensagemBoasVindas = (sufixo = 'inicial'): MensagemChat => ({
  id: `msg-boas-vindas-${sufixo}`,
  autor: 'dora',
  horario: obterHorarioAtual(),
  texto:
    `# Olá! Eu sou a Dora\n` +
    `## Assistente de Estoque • Casa da Criança\n` +
    `• **Receitas reais:** Sugiro preparos com ingredientes compatíveis do estoque.\n` +
    `• **Previsão de consumo:** Calculo a duração estimada de cada alimento.\n` +
    `• **Alerta de validade (FEFO):** Indico o que precisa sair primeiro.\n` +
    `• **Localização:** Mostro exatamente em qual prateleira cada lote está.`,
  sugestoesContinuacao: [
    '🍲 Me sugere uma receita?',
    '📈 Como está nosso estoque?',
    '⏰ O que vence nos próximos dias?',
    '📦 O que temos nas prateleiras?',
    '🧭 Como uso o aplicativo?',
  ],
});

const COMANDOS_VOZ_RAPIDOS = [
  '🍲 Me sugere uma receita com o que temos?',
  '📈 Previsão de quando vão acabar os alimentos',
  '⏰ Quais produtos vencem primeiro?',
  '📦 O que está guardado nas prateleiras?',
  '🧭 Como cadastro uma entrada no estoque?',
];

export default function DoraScreen() {
  const roteador = useRouter();
  const { theme, tokens, mode, fontScale } = useAppTheme();
  const scrollRef = useRef<any>(null);
  const geracaoConversaRef = useRef(0);
  const contadorIdRef = useRef(1);

  const [lotesReais, setLotesReais] = useState<LoteEstoqueDora[]>([]);
  const [movimentacoesReais, setMovimentacoesReais] = useState<MovimentacaoEstoqueDora[]>([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);
  const [processandoIa, setProcessandoIa] = useState(false);
  const [ultimaReceitaId, setUltimaReceitaId] = useState<string | undefined>(undefined);
  const [entradaTexto, setEntradaTexto] = useState('');
  const [exibirComandosVoz, setExibirComandosVoz] = useState(false);
  const [modalSobreDoraVisivel, setModalSobreDoraVisivel] = useState(false);
  const [historico, setHistorico] = useState<MensagemChat[]>(() => [criarMensagemBoasVindas()]);

  const coresChat = useMemo(() => {
    const modoEscuroOuContraste = mode === 'dark' || mode === 'high-contrast';
    return {
      cabecalho: mode === 'high-contrast' ? theme.surface : '#1E3A8A',
      canvas: modoEscuroOuContraste ? theme.background : '#EFEAE2',
      balaoDoraBg: mode === 'high-contrast' ? theme.surface : theme.surface,
      balaoDoraBorda: modoEscuroOuContraste ? theme.border : '#E2E8F0',
      balaoUsuarioBg: modoEscuroOuContraste ? '#064E3B' : '#DCF8C6',
      balaoUsuarioBorda: modoEscuroOuContraste ? '#10B981' : '#B7E89E',
      balaoUsuarioTexto: modoEscuroOuContraste ? '#FFFFFF' : '#111827',
      checkColor: '#10B981',
      composerDockBg: mode === 'high-contrast' ? theme.surface : '#F0F2F5',
    };
  }, [mode, theme]);

  const totalPacotesAtivos = useMemo(
    () => lotesReais.reduce((acc, item) => acc + (Number(item.quantidade_atual_pacote) || 0), 0),
    [lotesReais],
  );

  const sincronizarEstoqueEMMovimentacoes = useCallback(async () => {
    setCarregandoEstoque(true);
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      const listaBruta = Array.isArray(resposta?.lotes)
        ? resposta.lotes
        : Array.isArray(resposta?.dados)
          ? resposta.dados
          : [];

      if (resposta?.sucesso && Array.isArray(listaBruta)) {
        const ativos: LoteEstoqueDora[] = listaBruta
          .filter((l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0)
          .map((l: any) => {
            const dataVal = l.data_validade_lote || l.data_validade_rotulo || '';
            return {
              ...l,
              quantidade_atual_pacote: Number(l.quantidade_atual_pacote) || 0,
              data_validade_lote: dataVal,
              local_descricao: normalizarDescricaoPrateleira(
                l.local_descricao || l.id_local_armazenamento || 'Armário A - Prateleira 1',
              ),
              diasRestantes: calcularDiasAteVencimento(dataVal),
            };
          })
          .sort((a: LoteEstoqueDora, b: LoteEstoqueDora) => a.diasRestantes - b.diasRestantes);

        setLotesReais(ativos);
      }

      if (Array.isArray(resposta?.movimentacoes)) {
        setMovimentacoesReais(resposta.movimentacoes);
      }
    } catch {
      // Mantém estado local caso offline
    } finally {
      setCarregandoEstoque(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void sincronizarEstoqueEMMovimentacoes();
    }, 0);
    return () => clearTimeout(timer);
  }, [sincronizarEstoqueEMMovimentacoes]);

  const rolarParaFinal = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const limparConversa = () => {
    geracaoConversaRef.current += 1;
    contadorIdRef.current += 1;
    setHistorico([criarMensagemBoasVindas(String(contadorIdRef.current))]);
    setEntradaTexto('');
    setUltimaReceitaId(undefined);
    setExibirComandosVoz(false);
    setProcessandoIa(false);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 80);
  };

  const enviarMensagem = async (textoManual?: string) => {
    const perguntaFinal = (textoManual ?? entradaTexto).trim();
    if (!perguntaFinal || processandoIa) return;

    const geracaoAtual = geracaoConversaRef.current;
    if (!textoManual) setEntradaTexto('');
    setExibirComandosVoz(false);

    contadorIdRef.current += 1;
    const msgUsuario: MensagemChat = {
      id: `usr-${contadorIdRef.current}`,
      autor: 'usuario',
      horario: obterHorarioAtual(),
      texto: perguntaFinal,
    };

    setHistorico((anterior) => [...anterior, msgUsuario]);
    setProcessandoIa(true);
    rolarParaFinal();

    try {
      const respostaLocal = responderConversaDora(
        perguntaFinal,
        lotesReais,
        movimentacoesReais,
        ultimaReceitaId,
      );

      if (respostaLocal.receita?.id) {
        setUltimaReceitaId(respostaLocal.receita.id);
      }

      try {
        await requisicaoApi('/api/dora', {
          metodo: 'POST',
          dados: {
            modulo: 'dora',
            acao: 'processar_pergunta',
            mensagem: perguntaFinal,
            pergunta: perguntaFinal,
            lotes_estoque: lotesReais,
          },
          timeoutMs: 6000,
        });
      } catch {
        // Segue com a resposta estruturada local
      }

      if (geracaoAtual !== geracaoConversaRef.current) return;

      contadorIdRef.current += 1;
      const idRespDora = `dora-${contadorIdRef.current}`;
      setHistorico((anterior) => [
        ...anterior,
        {
          id: idRespDora,
          autor: 'dora',
          horario: obterHorarioAtual(),
          texto: respostaLocal.texto,
          receita: respostaLocal.receita,
          predicoes: respostaLocal.predicoes,
          atalho: respostaLocal.atalho,
          sugestoesContinuacao: respostaLocal.sugestoesContinuacao,
        },
      ]);
      rolarParaFinal();
    } catch {
      if (geracaoAtual === geracaoConversaRef.current) {
        contadorIdRef.current += 1;
        const idErroDora = `erro-${contadorIdRef.current}`;
        setHistorico((anterior) => [
          ...anterior,
          {
            id: idErroDora,
            autor: 'dora',
            horario: obterHorarioAtual(),
            texto:
              `# Ops! Algo falhou\n` +
              `## Não consegui processar agora\n` +
              `• **Ação recomendada:** Tente enviar sua pergunta novamente.`,
          },
        ]);
      }
    } finally {
      if (geracaoAtual === geracaoConversaRef.current) {
        setProcessandoIa(false);
      }
    }
  };

  const renderizarTrechosNegrito = (texto: string, corTexto: string) => {
    const partes = texto.split(/(\*\*.*?\*\*)/g);
    return partes.map((trecho, idx) => {
      if (trecho.startsWith('**') && trecho.endsWith('**')) {
        return (
          <Text key={idx} style={{ fontWeight: '800', color: corTexto }}>
            {trecho.slice(2, -2)}
          </Text>
        );
      }
      return (
        <Text key={idx} style={{ color: corTexto }}>
          {trecho}
        </Text>
      );
    });
  };

  /**
   * Renderiza títulos (#), subtítulos (##) e tópicos em bullet points (• / 1.)
   * garantindo leitura escaneável estilo mensageria sem blocos de texto corrido.
   */
  const renderizarConteudoEstruturado = (texto: string, corBase: string) => {
    const linhas = texto
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return (
      <View style={{ gap: 2 }}>
        {linhas.map((linha, idx) => {
          if (linha.startsWith('# ')) {
            return (
              <Text
                key={idx}
                style={[
                  estilosDora.tituloBloco,
                  {
                    color: '#1E3A8A',
                    fontSize: 15 * fontScale,
                  },
                ]}
              >
                {linha.slice(2)}
              </Text>
            );
          }

          if (linha.startsWith('## ')) {
            return (
              <Text
                key={idx}
                style={[
                  estilosDora.subtituloBloco,
                  {
                    color: '#047857',
                    fontSize: 12.5 * fontScale,
                  },
                ]}
              >
                {linha.slice(3)}
              </Text>
            );
          }

          const ehBullet = linha.startsWith('• ') || linha.startsWith('- ');
          if (ehBullet) {
            return (
              <View key={idx} style={estilosDora.linhaTopico}>
                <View
                  style={[estilosDora.marcadorTopico, { backgroundColor: '#10B981' }]}
                />
                <Text
                  style={[
                    estilosDora.textoMensagem,
                    {
                      flex: 1,
                      color: corBase,
                      fontSize: tokens.typography.fontSize.sm * fontScale,
                    },
                  ]}
                >
                  {renderizarTrechosNegrito(linha.slice(2), corBase)}
                </Text>
              </View>
            );
          }

          return (
            <Text
              key={idx}
              style={[
                estilosDora.textoMensagem,
                {
                  color: corBase,
                  fontSize: tokens.typography.fontSize.sm * fontScale,
                },
              ]}
            >
              {renderizarTrechosNegrito(linha, corBase)}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderizarAvatarDora = (tamanho = 40) => (
    <TouchableOpacity
      onPress={() => setModalSobreDoraVisivel(true)}
      activeOpacity={0.8}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel="Conhecer a assistente Dora"
    >
      <Image
        source={AVATAR_DORA_ASSET}
        style={{
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          borderWidth: 1.5,
          borderColor: '#10B981',
          backgroundColor: '#D1FAE5',
        }}
        resizeMode="cover"
        accessibilityLabel="Avatar da assistente Dora"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[estilosDora.tela, { backgroundColor: coresChat.canvas }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Cabeçalho nativo estilo WhatsApp */}
        <View style={[estilosDora.cabecalhoWhatsapp, { backgroundColor: coresChat.cabecalho }]}>
          <View style={estilosDora.cabecalhoEsquerda}>
            <TouchableOpacity
              onPress={() => roteador.back()}
              style={estilosDora.botaoIconeCabecalho}
              accessibilityRole="button"
              accessibilityLabel="Voltar para tela anterior"
            >
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={estilosDora.avatarWrapper}>
              {renderizarAvatarDora(42)}
              <View style={estilosDora.pontoOnline} pointerEvents="none" />
            </View>

            <View style={estilosDora.cabecalhoInfo}>
              <Text
                style={[estilosDora.cabecalhoTitulo, { fontSize: 16 * fontScale }]}
                numberOfLines={1}
              >
                Dora • Assistente IA
              </Text>
              <Text
                style={[estilosDora.cabecalhoSubtitulo, { fontSize: 11.5 * fontScale }]}
                numberOfLines={1}
              >
                {processandoIa
                  ? 'digitando...'
                  : carregandoEstoque
                    ? 'sincronizando despensa...'
                    : `online • ${totalPacotesAtivos} pcts acompanhados`}
              </Text>
            </View>
          </View>

          <View style={estilosDora.cabecalhoAcoes}>
            <TouchableOpacity
              onPress={sincronizarEstoqueEMMovimentacoes}
              style={estilosDora.botaoIconeCabecalho}
              accessibilityRole="button"
              accessibilityLabel="Atualizar leitura do estoque"
            >
              <Feather name="refresh-cw" size={19} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={limparConversa}
              style={estilosDora.botaoIconeCabecalho}
              accessibilityRole="button"
              accessibilityLabel="Limpar conversa"
            >
              <Feather name="trash-2" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Área de mensagens estilo chat nativo */}
        <ScrollView
          ref={scrollRef}
          style={estilosDora.listaChat}
          contentContainerStyle={estilosDora.listaChatConteudo}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilosDora.divisorDataWrapper}>
            <View style={estilosDora.divisorDataPill}>
              <Text
                style={[
                  estilosDora.divisorDataTexto,
                  { color: '#1E3A8A', fontSize: 10.5 * fontScale },
                ]}
              >
                HOJE • DOAR & GUARDAR
              </Text>
            </View>
          </View>

          {historico.map((msg, indice) => {
            const ehDora = msg.autor === 'dora';
            const ehUltimaMensagem = indice === historico.length - 1;

            if (!ehDora) {
              return (
                <View key={msg.id} style={estilosDora.linhaMensagemUsuario}>
                  <View
                    style={[
                      estilosDora.balaoUsuario,
                      {
                        backgroundColor: coresChat.balaoUsuarioBg,
                        borderColor: coresChat.balaoUsuarioBorda,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        estilosDora.textoMensagem,
                        {
                          color: coresChat.balaoUsuarioTexto,
                          fontSize: tokens.typography.fontSize.sm * fontScale,
                        },
                      ]}
                    >
                      {msg.texto}
                    </Text>

                    <View style={estilosDora.rodapeBalao}>
                      <Text
                        style={[
                          estilosDora.horarioBalao,
                          { color: '#4B5563', fontSize: 10 * fontScale },
                        ]}
                      >
                        {msg.horario}
                      </Text>
                      <Feather name="check" size={13} color="#1E3A8A" />
                      <Feather
                        name="check"
                        size={13}
                        color="#10B981"
                        style={{ marginLeft: -8 }}
                      />
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View key={msg.id}>
                <View style={estilosDora.linhaMensagemDora}>
                  {renderizarAvatarDora(32)}

                  <View
                    style={[
                      estilosDora.balaoDora,
                      {
                        backgroundColor: coresChat.balaoDoraBg,
                        borderColor: coresChat.balaoDoraBorda,
                      },
                    ]}
                  >
                    {renderizarConteudoEstruturado(msg.texto, theme.text)}

                    {msg.receita && (
                      <View
                        style={[
                          estilosDora.cartaoReceita,
                          {
                            backgroundColor: '#F8FAFC',
                            borderColor: '#1E3A8A35',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            estilosDora.tituloReceita,
                            { color: '#1E3A8A', fontSize: 14 * fontScale },
                          ]}
                        >
                          {msg.receita.titulo}
                        </Text>
                        <Text
                          style={{
                            color: '#047857',
                            fontWeight: '700',
                            fontSize: 11.5 * fontScale,
                            marginBottom: 8,
                          }}
                        >
                          Tempo: {msg.receita.tempoPreparo} • Rendimento: {msg.receita.rendimento}
                        </Text>

                        <Text
                          style={[
                            estilosDora.subtituloBloco,
                            { color: '#1E3A8A', fontSize: 12 * fontScale },
                          ]}
                        >
                          Ingredientes do Estoque (FEFO)
                        </Text>
                        {renderizarConteudoEstruturado(msg.receita.ingredientesEstoque, theme.text)}

                        <Text
                          style={[
                            estilosDora.subtituloBloco,
                            { color: '#1E3A8A', fontSize: 12 * fontScale },
                          ]}
                        >
                          Modo de Preparo
                        </Text>
                        <Text
                          style={[
                            estilosDora.topicoReceita,
                            { color: theme.text, fontSize: 12 * fontScale },
                          ]}
                        >
                          {msg.receita.modoPreparo}
                        </Text>

                        <TouchableOpacity
                          onPress={() => Linking.openURL(msg.receita!.fonteUrl)}
                          style={{ minHeight: 48, justifyContent: 'center' }}
                          accessibilityRole="link"
                        >
                          <Text
                            style={[
                              estilosDora.linkFonte,
                              { color: '#1E3A8A', fontSize: 12 * fontScale },
                            ]}
                          >
                            Ver fonte: {msg.receita.fonteNome}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {Array.isArray(msg.predicoes) && msg.predicoes.length > 0 && (
                      <View
                        style={[
                          estilosDora.cartaoPredicoes,
                          {
                            backgroundColor: '#F8FAFC',
                            borderColor: '#1E3A8A30',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: '#1E3A8A',
                            fontWeight: '800',
                            fontSize: 12 * fontScale,
                          }}
                        >
                          Resumo de Autonomia Estimada
                        </Text>
                        {msg.predicoes.map((pred) => (
                          <View
                            key={pred.nomeProduto}
                            style={[
                              estilosDora.itemPredicao,
                              {
                                backgroundColor: '#FFFFFF',
                                borderColor: pred.riscoVencerAntesDeAcabar ? '#DC2626' : '#E2E8F0',
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontWeight: '800',
                                color: theme.text,
                                fontSize: 12 * fontScale,
                              }}
                            >
                              {pred.nomeProduto}
                            </Text>
                            <Text
                              style={{
                                color: theme.subtext,
                                fontSize: 11 * fontScale,
                                marginTop: 2,
                              }}
                            >
                              • Saldo: {pred.saldoTotal} pcts • ~{pred.consumoDiarioEstimado}/dia •
                              Duração: {pred.diasAutonomia}d
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {msg.atalho && (
                      <TouchableOpacity
                        onPress={() => roteador.push(msg.atalho!.rota as any)}
                        style={[estilosDora.botaoAtalho, { backgroundColor: '#10B981' }]}
                        accessibilityRole="button"
                        accessibilityLabel={msg.atalho.rotulo}
                      >
                        <Feather name={(msg.atalho.icone as any) || 'arrow-right'} size={17} color="#FFFFFF" />
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontWeight: '800',
                            fontSize: 13 * fontScale,
                          }}
                        >
                          {msg.atalho.rotulo}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <View style={estilosDora.rodapeBalao}>
                      <Text
                        style={[
                          estilosDora.horarioBalao,
                          { color: theme.subtext, fontSize: 10 * fontScale },
                        ]}
                      >
                        {msg.horario}
                      </Text>
                    </View>
                  </View>
                </View>

                {ehUltimaMensagem &&
                  Array.isArray(msg.sugestoesContinuacao) &&
                  msg.sugestoesContinuacao.length > 0 && (
                    <View style={estilosDora.sugestoesContainer}>
                      {msg.sugestoesContinuacao.map((sug) => (
                        <TouchableOpacity
                          key={sug}
                          onPress={() => enviarMensagem(sug)}
                          style={[
                            estilosDora.chipSugestao,
                            {
                              backgroundColor: theme.surface,
                              borderColor: '#1E3A8A55',
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Perguntar: ${sug}`}
                        >
                          <Text
                            style={{
                              color: '#1E3A8A',
                              fontWeight: '700',
                              fontSize: 12 * fontScale,
                            }}
                          >
                            {sug}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
              </View>
            );
          })}

          {processandoIa && (
            <View style={estilosDora.linhaMensagemDora}>
              {renderizarAvatarDora(32)}
              <View
                style={[
                  estilosDora.balaoDora,
                  {
                    backgroundColor: coresChat.balaoDoraBg,
                    borderColor: coresChat.balaoDoraBorda,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  },
                ]}
              >
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, fontWeight: '600' }}>
                  Dora está preparando a resposta...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Painel rápido de comandos por voz / frases prontas */}
        {exibirComandosVoz && (
          <View
            style={[
              estilosDora.painelVoz,
              {
                backgroundColor: theme.surface,
                borderTopColor: theme.border,
              },
            ]}
          >
            <Text
              style={{
                fontWeight: '800',
                color: '#1E3A8A',
                fontSize: 12 * fontScale,
                marginBottom: 8,
              }}
            >
              Toque em uma pergunta pronta ou use o ditado do teclado:
            </Text>
            <View style={estilosDora.gradeVoz}>
              {COMANDOS_VOZ_RAPIDOS.map((cmd) => (
                <TouchableOpacity
                  key={cmd}
                  onPress={() => enviarMensagem(cmd)}
                  style={[
                    estilosDora.chipVoz,
                    {
                      backgroundColor: '#F8FAFC',
                      borderColor: '#1E3A8A45',
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={{ color: theme.text, fontWeight: '600', fontSize: 12 * fontScale }}>
                    {cmd}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Composer único nativo estilo WhatsApp */}
        <View
          style={[
            estilosDora.composerDock,
            {
              backgroundColor: coresChat.composerDockBg,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View style={estilosDora.composerRow}>
            <View
              style={[
                estilosDora.composerInputBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setExibirComandosVoz((v) => !v)}
                style={estilosDora.botaoMic}
                accessibilityRole="button"
                accessibilityLabel="Alternar sugestões rápidas"
              >
                <Feather
                  name="mic"
                  size={20}
                  color={exibirComandosVoz ? '#10B981' : '#1E3A8A'}
                />
              </TouchableOpacity>

              <TextInput
                placeholder="Mensagem para a Dora..."
                placeholderTextColor={theme.subtext}
                value={entradaTexto}
                onChangeText={setEntradaTexto}
                onSubmitEditing={() => enviarMensagem()}
                returnKeyType="send"
                accessibilityLabel="Campo de mensagem para a assistente Dora"
                style={[
                  estilosDora.campoDigitacao,
                  {
                    color: theme.text,
                    fontSize: tokens.typography.fontSize.sm * fontScale,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={() => enviarMensagem()}
              disabled={!entradaTexto.trim() || processandoIa}
              style={[
                estilosDora.botaoEnviarCircular,
                {
                  backgroundColor: entradaTexto.trim() ? '#10B981' : '#1E3A8A',
                  opacity: !entradaTexto.trim() || processandoIa ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem para a Dora"
            >
              <Feather name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalSobreDoraVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalSobreDoraVisivel(false)}
      >
        <View style={estilosDora.modalSobreOverlay}>
          <View
            style={[
              estilosDora.modalSobreCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={estilosDora.modalSobreTopo}>
              <TouchableOpacity
                onPress={() => setModalSobreDoraVisivel(false)}
                style={estilosDora.modalSobreBotaoFechar}
                accessibilityRole="button"
                accessibilityLabel="Fechar apresentação da Dora"
              >
                <Feather name="x" size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={estilosDora.modalSobreCabecalhoAvatar}>
                <Image
                  source={AVATAR_DORA_ASSET}
                  style={estilosDora.modalSobreImagem}
                  resizeMode="cover"
                  accessibilityLabel="Foto da assistente Dora"
                />
                <Text
                  style={[
                    estilosDora.modalSobreNome,
                    { color: '#1E3A8A', fontSize: 20 * fontScale },
                  ]}
                >
                  Oi! Eu sou a Dora 👋
                </Text>
                <Text
                  style={[
                    estilosDora.modalSobreCargo,
                    { color: '#047857', fontSize: 12.5 * fontScale },
                  ]}
                >
                  Assistente Inteligente • Doar & Guardar
                </Text>
              </View>

              <View
                style={[
                  estilosDora.modalSobreBalaoFala,
                  {
                    backgroundColor:
                      mode === 'dark' || mode === 'high-contrast' ? theme.background : '#F0FDF4',
                    borderColor:
                      mode === 'dark' || mode === 'high-contrast' ? theme.border : '#BBF7D0',
                  },
                ]}
              >
                <Text
                  style={[
                    estilosDora.modalSobreTextoFala,
                    { color: theme.text, fontSize: 13.5 * fontScale },
                  ]}
                >
                  Eu sou a assistente virtual do{' '}
                  <Text style={{ fontWeight: '800', color: '#1E3A8A' }}>Doar & Guardar</Text>,
                  criada para ajudar você e toda a equipe da{' '}
                  <Text style={{ fontWeight: '800' }}>Casa da Criança</Text> a cuidar do estoque de
                  alimentos com praticidade e sem desperdícios!
                </Text>

                <Text
                  style={[
                    estilosDora.modalSobreTextoFala,
                    { color: '#047857', fontWeight: '800', fontSize: 13 * fontScale, marginTop: 2 },
                  ]}
                >
                  Veja o que eu consigo fazer por você no sistema:
                </Text>

                <Text
                  style={[
                    estilosDora.modalSobreTextoFala,
                    { color: theme.text, fontSize: 13 * fontScale },
                  ]}
                >
                  • <Text style={{ fontWeight: '800' }}>Sugerir receitas reais:</Text> olho o que já
                  temos na despensa e indico preparos compatíveis usando ingredientes do estoque.
                </Text>
                <Text
                  style={[
                    estilosDora.modalSobreTextoFala,
                    { color: theme.text, fontSize: 13 * fontScale },
                  ]}
                >
                  • <Text style={{ fontWeight: '800' }}>Alertar validades (FEFO):</Text> mostro
                  quais produtos e lotes vencem primeiro para garantirmos que nada estrague.
                </Text>
                <Text
                  style={[
                    estilosDora.modalSobreTextoFala,
                    { color: theme.text, fontSize: 13 * fontScale },
                  ]}
                >
                  • <Text style={{ fontWeight: '800' }}>Prever o consumo:</Text> calculo a duração
                  estimada dos alimentos e aviso quando algum item precisa de reposição.
                </Text>
                <Text
                  style={[
                    estilosDora.modalSobreTextoFala,
                    { color: theme.text, fontSize: 13 * fontScale },
                  ]}
                >
                  • <Text style={{ fontWeight: '800' }}>Localizar nas prateleiras:</Text> informo
                  exatamente em qual armário ou geladeira cada lote está guardado.
                </Text>
                <Text
                  style={[
                    estilosDora.modalSobreTextoFala,
                    { color: theme.text, fontSize: 13 * fontScale },
                  ]}
                >
                  • <Text style={{ fontWeight: '800' }}>Guiar pelo aplicativo:</Text> tiro dúvidas
                  sobre cadastros, saídas e movimentações com atalhos diretos para as telas.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalSobreDoraVisivel(false)}
                style={estilosDora.modalSobreBotaoAcao}
                accessibilityRole="button"
                accessibilityLabel="Entendi, voltar para a conversa com a Dora"
              >
                <Feather name="message-circle" size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 * fontScale }}>
                  Entendi, vamos conversar!
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
