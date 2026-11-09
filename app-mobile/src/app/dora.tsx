
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/common/AppIcon';
import { estilosDora } from '../styles/dora.styles';
import { requisicaoApi } from '../services/api';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';
import {
  LoteEstoqueDora,
  MovimentacaoEstoqueDora,
  ReceitaSugerida,
  PredicaoProdutoML,
  AtalhoNavegacaoDora,
  calcularDiasAteVencimento,
  responderConversaDora,
} from '../services/doraService';

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

const CORES_DORA = {
  fundo: '#E6F0FA',
  fundoSecundario: '#E6F0FA',
  branco: '#FFFFFF',
  laranja: '#A8C5E0',
  laranjaPrincipal: '#315A7D',
  laranjaEscuro: '#315A7D',
  laranjaMuitoClaro: '#E6F0FA',
  borda: '#A8C5E0',
  texto: '#594334',
  textoSuave: '#987B64',
  amarelo: '#FFF0C2',
  verde: '#16A34A',
  vermelho: '#DC2626',
};

const obterHorarioAtual = (): string => {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const criarMensagemBoasVindas = (): MensagemChat => ({
  id: `msg-boas-vindas-${Date.now()}`,
  autor: 'dora',
  horario: obterHorarioAtual(),
  texto:
    'Olá! Que alegria ter você por aqui! 🥰💛\n\n' +
    'Eu sou a **Dora**, sua assistente inteligente da Casa da Criança! 👩🏽‍🍳\n\n' +
    'Estou aqui para ajudar a cuidar do nosso estoque e facilitar o dia a dia da nossa equipe. Juntas, podemos:\n\n' +
    '🍲 **Descobrir receitas** com os ingredientes que temos disponíveis.\n\n' +
    '📊 **Acompanhar o consumo** e prever quanto tempo os alimentos vão durar.\n\n' +
    '⏰ **Ficar de olho nas validades** para evitar desperdícios.\n\n' +
    '📦 **Consultar nossas prateleiras** e encontrar os produtos armazenados.\n\n' +
    '🧭 **Aprender a usar o aplicativo** com orientações simples, passo a passo.\n\n' +
    '✨ Estou pronta para ajudar!\n\n' +
    '💬 **Quando quiser conversar comigo, é só tocar no botão "Fale com a Dora", aqui embaixo da tela.** Vou adorar ajudar você!',
  sugestoesContinuacao: [
    '🍲 Me sugere uma receita?',
    '📈 Como está nosso estoque?',
    '⏰ O que vence nos próximos dias?',
    '📦 O que temos nas prateleiras?',
    '🧭 Como uso o aplicativo?',
  ],
});

export default function DoraScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const scrollRef = useRef<any>(null);
  const geracaoConversaRef = useRef(0);

  const [nomeUsuario, setNomeUsuario] = useState('Você');
  const [fotoUsuario, setFotoUsuario] = useState<string | null>(null);
  const [erroFotoUsuario, setErroFotoUsuario] = useState(false);

  const [entradaTexto, setEntradaTexto] = useState('');
  const [processandoIa, setProcessandoIa] = useState(false);
  const [lotesReais, setLotesReais] = useState<LoteEstoqueDora[]>([]);
  const [movimentacoesReais, setMovimentacoesReais] = useState<MovimentacaoEstoqueDora[]>([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);
  const [exibirComandosVoz, setExibirComandosVoz] = useState(false);
  const [exibirCaixaTextoFlutuante, setExibirCaixaTextoFlutuante] = useState(false);
  const [ultimaReceitaId, setUltimaReceitaId] = useState<string | undefined>(undefined);

  const [historico, setHistorico] = useState<MensagemChat[]>([
    criarMensagemBoasVindas(),
  ]);

  const comandosRapidos = [
    '🍲 Receita com itens do estoque',
    '📈 Previsão de consumo',
    '⏰ O que vence logo?',
    '📦 Resumo das prateleiras',
    '🧭 Como cadastrar entrada?',
    '🔄 Como mudar de prateleira?',
  ];

  useEffect(() => {
    const desinscrever = auth.onAuthStateChanged((user) => {
      if (user) {
        const primeiroNome = (
          user.displayName || user.email?.split('@')[0] || 'Você'
        ).split(' ')[0];

        setNomeUsuario(primeiroNome);

        if (user.photoURL) {
          setFotoUsuario(user.photoURL);
          setErroFotoUsuario(false);
        }
      }
    });

    return () => desinscrever();
  }, []);

  const sincronizarEstoqueEMMovimentacoes = useCallback(async () => {
    try {
      setCarregandoEstoque(true);

      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'consultar_estoque',
        },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        const ativos: LoteEstoqueDora[] = resposta.lotes
          .filter(
            (l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0
          )
          .map((l: any) => {
            const dataVal =
              l.data_validade_lote || l.data_validade_rotulo || '';

            return {
              ...l,
              quantidade_atual_pacote:
                Number(l.quantidade_atual_pacote) || 0,
              data_validade_lote: dataVal,
              local_descricao: normalizarDescricaoPrateleira(
                l.local_descricao ||
                  l.id_local_armazenamento ||
                  'Armário A - Prateleira 1'
              ),
              diasRestantes: calcularDiasAteVencimento(dataVal),
            };
          })
          .sort(
            (a: LoteEstoqueDora, b: LoteEstoqueDora) =>
              a.diasRestantes - b.diasRestantes
          );

        setLotesReais(ativos);
      }

      if (Array.isArray(resposta?.movimentacoes)) {
        setMovimentacoesReais(resposta.movimentacoes);
      }
    } catch {
      // Mantém o estado atual caso ocorra uma falha de conexão.
    } finally {
      setCarregandoEstoque(false);
    }
  }, []);

  useEffect(() => {
    sincronizarEstoqueEMMovimentacoes();
  }, [sincronizarEstoqueEMMovimentacoes]);

  const rolarParaFinal = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const limparConversa = () => {
    geracaoConversaRef.current += 1;

    setHistorico([criarMensagemBoasVindas()]);
    setEntradaTexto('');
    setUltimaReceitaId(undefined);
    setExibirComandosVoz(false);
    setExibirCaixaTextoFlutuante(false);
    setProcessandoIa(false);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }, 100);
  };

  const enviarMensagem = async (textoManual?: string) => {
    const perguntaFinal = (textoManual ?? entradaTexto).trim();

    if (!perguntaFinal || processandoIa) return;

    const geracaoAtual = geracaoConversaRef.current;

    if (!textoManual) {
      setEntradaTexto('');
    }

    setExibirComandosVoz(false);

    const msgUsuario: MensagemChat = {
      id: `usr-${Date.now()}`,
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
        ultimaReceitaId
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
        });
      } catch {
        // Continua normalmente com a resposta do motor local.
      }

      if (geracaoAtual !== geracaoConversaRef.current) {
        return;
      }

      setHistorico((anterior) => [
        ...anterior,
        {
          id: `dora-${Date.now()}`,
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
        setHistorico((anterior) => [
          ...anterior,
          {
            id: `erro-${Date.now()}`,
            autor: 'dora',
            horario: obterHorarioAtual(),
            texto: 'Desculpe, tive um probleminha para responder. Pode tentar novamente? 💛',
          },
        ]);
      }
    } finally {
      if (geracaoAtual === geracaoConversaRef.current) {
        setProcessandoIa(false);
      }
    }
  };

  const renderizarTextoFormatado = (
    texto: string,
    corTexto: string
  ) => {
    const partes = texto.split(/(\*\*.*?\*\*)/g);

    return (
      <Text
        style={[
          estilosDora.textoMensagem,
          {
            color: corTexto,
            fontSize: tokens.typography.fontSize.sm * fontScale,
            lineHeight: 21 * fontScale,
          },
        ]}
      >
        {partes.map((trecho, idx) => {
          if (trecho.startsWith('**') && trecho.endsWith('**')) {
            return (
              <Text key={idx} style={{ fontWeight: '800' }}>
                {trecho.slice(2, -2)}
              </Text>
            );
          }

          return <Text key={idx}>{trecho}</Text>;
        })}
      </Text>
    );
  };

  const renderizarAvatarDora = (tamanho = 40) => (
    <View
      style={[
        estilosDora.avatarContainer,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: CORES_DORA.amarelo,
          borderWidth: 2,
          borderColor: CORES_DORA.laranja,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text style={{ fontSize: tamanho * 0.52 }}>👩🏽‍🍳</Text>
      <View style={estilosDora.indicadorOnline} />
    </View>
  );

  const renderizarAvatarUsuario = (tamanho = 40) => {
    const mostrarFoto = Boolean(fotoUsuario && !erroFotoUsuario);
    const inicial = (nomeUsuario || 'V').charAt(0).toUpperCase();

    return (
      <View
        style={[
          estilosDora.avatarContainer,
          {
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            backgroundColor: `${theme.primary}20`,
            borderWidth: 2,
            borderColor: theme.primary,
          },
        ]}
      >
        {mostrarFoto ? (
          <Image
            source={{ uri: fotoUsuario! }}
            style={{
              width: tamanho - 4,
              height: tamanho - 4,
              borderRadius: (tamanho - 4) / 2,
            }}
            onError={() => setErroFotoUsuario(true)}
          />
        ) : (
          <Text
            style={{
              fontWeight: '800',
              color: theme.primary,
              fontSize: tamanho * 0.4,
            }}
          >
            {inicial}
          </Text>
        )}
      </View>
    );
  };

  const totalPacotesAtivos = lotesReais.reduce(
    (acc, l) => acc + (Number(l.quantidade_atual_pacote) || 0),
    0
  );

  return (
    <SafeAreaView
      style={[
        estilosDora.container,
        { backgroundColor: CORES_DORA.fundo },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Cabeçalho */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: CORES_DORA.branco,
            borderBottomWidth: 1,
            borderBottomColor: CORES_DORA.borda,
            shadowColor: '#A65D20',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 5,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flex: 1,
              }}
            >
              

              {renderizarAvatarDora(46)}

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '900',
                      color: CORES_DORA.texto,
                      fontSize: 17 * fontScale,
                    }}
                  >
                    Dora ✨
                  </Text>

                  <View
                    style={{
                      backgroundColor: CORES_DORA.laranjaMuitoClaro,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: CORES_DORA.borda,
                    }}
                  >
                    <Text
                      style={{
                        color: CORES_DORA.laranjaEscuro,
                        fontWeight: '800',
                        fontSize: 9.5 * fontScale,
                      }}
                    >
                      IA & Previsões
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: CORES_DORA.textoSuave,
                    fontSize: 11.5 * fontScale,
                    marginTop: 3,
                  }}
                  numberOfLines={1}
                >
                  {carregandoEstoque
                    ? 'Olhando as prateleiras agora...'
                    : `Online • ${totalPacotesAtivos} pacotes acompanhados no estoque`}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Atualizar informações do estoque"
                onPress={sincronizarEstoqueEMMovimentacoes}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: CORES_DORA.fundo,
                  borderWidth: 1,
                  borderColor: CORES_DORA.borda,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather
                  name="refresh-cw"
                  size={15}
                  color={CORES_DORA.laranjaEscuro}
                />
              </TouchableOpacity>

              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Ver meu perfil"
                onPress={() => roteador.push('/profile' as any)}
              >
                {renderizarAvatarUsuario(36)}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Área das mensagens */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            estilosDora.rolagem,
            {
              paddingHorizontal: 14,
              paddingTop: 18,
              paddingBottom: 150,
              backgroundColor: CORES_DORA.fundo,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={rolarParaFinal}
        >
          {/* Perguntas rápidas */}
          <View
            style={[
              estilosDora.faixaExemplos,
              {
                backgroundColor: CORES_DORA.branco,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: CORES_DORA.borda,
                padding: 12,
                marginBottom: 16,
                shadowColor: '#A65D20',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 1,
              },
            ]}
          >
            <Text
              style={[
                estilosDora.rotuloExemplos,
                {
                  color: CORES_DORA.textoSuave,
                  fontSize: 11.5 * fontScale,
                  fontWeight: '700',
                  marginBottom: 8,
                },
              ]}
            >
              💡 Toque em um assunto para conversar com a Dora:
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
                paddingVertical: 2,
              }}
            >
              {comandosRapidos.map((cmd) => (
                <TouchableOpacity
                  key={cmd}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Perguntar para a Dora: ${cmd}`}
                  onPress={() => enviarMensagem(cmd)}
                  style={[
                    estilosDora.pilulaSugestao,
                    {
                      backgroundColor: CORES_DORA.laranjaMuitoClaro,
                      borderColor: CORES_DORA.borda,
                      borderWidth: 1,
                      borderRadius: 20,
                    },
                  ]}
                >
                  <Text
                    style={[
                      estilosDora.textoPilula,
                      {
                        color: CORES_DORA.texto,
                        fontSize: 11.5 * fontScale,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {cmd}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Histórico de mensagens */}
          {historico.map((msg) => {
            const ehDora = msg.autor === 'dora';

            return (
              <View key={msg.id} style={{ marginBottom: 16 }}>
                <View
                  accessible={true}
                  accessibilityLabel={`${
                    ehDora ? 'Dora disse' : `${nomeUsuario} disse`
                  }: ${msg.texto}`}
                  style={[
                    estilosDora.linhaMensagem,
                    ehDora
                      ? estilosDora.linhaMensagemDora
                      : estilosDora.linhaMensagemUsuario,
                    {
                      alignItems: 'flex-end',
                    },
                  ]}
                >
                  {ehDora && renderizarAvatarDora(38)}

                  <View
                    style={[
                      estilosDora.balaoMensagem,
                      {
                        backgroundColor: ehDora
                          ? CORES_DORA.branco
                          : CORES_DORA.laranjaPrincipal,
                        borderColor: ehDora
                          ? CORES_DORA.borda
                          : CORES_DORA.laranjaPrincipal,
                        borderWidth: 1,
                        borderRadius: 20,
                        padding: 14,
                        borderBottomLeftRadius: ehDora ? 5 : 20,
                        borderBottomRightRadius: ehDora ? 20 : 5,
                        shadowColor: '#A65D20',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: ehDora ? 0.07 : 0,
                        shadowRadius: 7,
                        elevation: ehDora ? 2 : 0,
                      },
                    ]}
                  >
                    <View style={estilosDora.cabecalhoBalao}>
                      <Text
                        style={[
                          estilosDora.autorBalao,
                          {
                            color: ehDora
                              ? CORES_DORA.laranjaEscuro
                              : '#FFFFFF',
                            fontSize: 11.5 * fontScale,
                            fontWeight: '800',
                          },
                        ]}
                      >
                        {ehDora ? 'Dora 👩🏽‍🍳' : nomeUsuario}
                      </Text>

                      <Text
                        style={[
                          estilosDora.horarioBalao,
                          {
                            color: ehDora ? CORES_DORA.textoSuave : '#FFF0DF',
                            fontSize: 10 * fontScale,
                          },
                        ]}
                      >
                        {msg.horario}
                      </Text>
                    </View>

                    {renderizarTextoFormatado(
                      msg.texto,
                      ehDora ? CORES_DORA.texto : '#FFFFFF'
                    )}

                    {/* Previsões de consumo */}
                    {msg.predicoes && msg.predicoes.length > 0 && (
                      <View
                        style={[
                          estilosDora.cartaoPredicoes,
                          {
                            backgroundColor: CORES_DORA.fundo,
                            borderColor: CORES_DORA.borda,
                            borderRadius: 14,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontWeight: '800',
                            color: CORES_DORA.laranjaEscuro,
                            fontSize: 12 * fontScale,
                            marginBottom: 8,
                          }}
                        >
                          📊 Resumo Visual de Duração do Estoque:
                        </Text>

                        {msg.predicoes.map((pred) => {
                          const porcentagemBarra = Math.min(
                            100,
                            Math.max(
                              12,
                              Math.round((pred.diasAutonomia / 30) * 100)
                            )
                          );

                          const corBarra = pred.riscoVencerAntesDeAcabar
                            ? '#F59E0B'
                            : pred.precisaReposicaoBreve
                            ? '#EF4444'
                            : CORES_DORA.verde;

                          return (
                            <View
                              key={pred.nomeProduto}
                              style={[
                                estilosDora.itemPredicao,
                                {
                                  backgroundColor: CORES_DORA.branco,
                                  borderColor: CORES_DORA.borda,
                                  borderRadius: 12,
                                },
                              ]}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={{
                                    fontWeight: '700',
                                    color: CORES_DORA.texto,
                                    fontSize: 11.5 * fontScale,
                                    flex: 1,
                                  }}
                                  numberOfLines={1}
                                >
                                  {pred.nomeProduto} ({pred.saldoTotal} pcts)
                                </Text>

                                <Text
                                  style={{
                                    fontWeight: '800',
                                    color: corBarra,
                                    fontSize: 11 * fontScale,
                                  }}
                                >
                                  ~{pred.diasAutonomia} dias
                                </Text>
                              </View>

                              <View
                                style={{
                                  height: 7,
                                  backgroundColor: CORES_DORA.fundoSecundario,
                                  borderRadius: 4,
                                  marginTop: 7,
                                  overflow: 'hidden',
                                }}
                              >
                                <View
                                  style={{
                                    width: `${porcentagemBarra}%`,
                                    height: '100%',
                                    backgroundColor: corBarra,
                                    borderRadius: 4,
                                  }}
                                />
                              </View>

                              <Text
                                style={{
                                  color: CORES_DORA.textoSuave,
                                  fontSize: 10 * fontScale,
                                  marginTop: 5,
                                }}
                              >
                                Guardado em: {pred.prateleiras.join(', ')}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Receita */}
                    {msg.receita && (
                      <View
                        style={[
                          estilosDora.cartaoReceita,
                          {
                            backgroundColor: CORES_DORA.fundo,
                            borderColor: CORES_DORA.laranja,
                            borderRadius: 14,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            estilosDora.tituloReceita,
                            {
                              color: CORES_DORA.laranjaEscuro,
                              fontSize: 13.5 * fontScale,
                            },
                          ]}
                        >
                          🍲 {msg.receita.titulo}
                        </Text>

                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 12,
                            marginBottom: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Text
                            style={{
                              color: CORES_DORA.textoSuave,
                              fontSize: 11 * fontScale,
                              fontWeight: '600',
                            }}
                          >
                            ⏱️ Preparo: {msg.receita.tempoPreparo}
                          </Text>

                          <Text
                            style={{
                              color: CORES_DORA.textoSuave,
                              fontSize: 11 * fontScale,
                              fontWeight: '600',
                            }}
                          >
                            🍽️ Rende: {msg.receita.rendimento}
                          </Text>
                        </View>

                        <Text
                          style={[
                            estilosDora.topicoReceita,
                            {
                              color: CORES_DORA.texto,
                              fontSize: 12 * fontScale,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontWeight: 'bold',
                              color: CORES_DORA.laranjaEscuro,
                            }}
                          >
                            📦 O que vamos usar das nossas prateleiras:
                            {'\n'}
                          </Text>
                          {msg.receita.ingredientesEstoque}
                        </Text>

                        {msg.receita.ingredientesComplementares && (
                          <Text
                            style={[
                              estilosDora.topicoReceita,
                              {
                                color: CORES_DORA.texto,
                                fontSize: 12 * fontScale,
                              },
                            ]}
                          >
                            <Text style={{ fontWeight: 'bold' }}>
                              🧂 Para completar na cozinha:
                              {'\n'}
                            </Text>
                            {msg.receita.ingredientesComplementares}
                          </Text>
                        )}

                        <Text
                          style={[
                            estilosDora.topicoReceita,
                            {
                              color: CORES_DORA.texto,
                              fontSize: 12 * fontScale,
                            },
                          ]}
                        >
                          <Text style={{ fontWeight: 'bold' }}>
                            👩🏽‍🍳 Passo a passo com carinho:
                            {'\n'}
                          </Text>
                          {msg.receita.modoPreparo}
                        </Text>

                        {msg.receita.dicaDora && (
                          <View
                            style={{
                              backgroundColor: CORES_DORA.amarelo,
                              padding: 9,
                              borderRadius: 10,
                              marginBottom: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: CORES_DORA.laranjaEscuro,
                                fontSize: 11 * fontScale,
                                fontWeight: '600',
                              }}
                            >
                              💡 {msg.receita.dicaDora}
                            </Text>
                          </View>
                        )}

                        <TouchableOpacity
                          accessible={true}
                          accessibilityRole="link"
                          accessibilityLabel={`Abrir receita completa em ${msg.receita.fonteNome}`}
                          onPress={() =>
                            Linking.openURL(msg.receita!.fonteUrl).catch(
                              () => {}
                            )
                          }
                        >
                          <Text
                            style={[
                              estilosDora.linkFonte,
                              {
                                color: CORES_DORA.laranjaEscuro,
                                fontSize: 11.5 * fontScale,
                              },
                            ]}
                          >
                            🔗 Ver inspiração completa: {msg.receita.fonteNome}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Atalho para outra tela */}
                    {msg.atalho && msg.atalho.rota !== '/dora' && (
                      <TouchableOpacity
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={msg.atalho.rotulo}
                        onPress={() =>
                          roteador.push(msg.atalho!.rota as any)
                        }
                        style={{
                          marginTop: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          backgroundColor: CORES_DORA.laranjaMuitoClaro,
                          borderColor: CORES_DORA.laranja,
                          borderWidth: 1,
                          borderRadius: 12,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                        }}
                      >
                        <Feather
                          name={msg.atalho.icone as any}
                          size={15}
                          color={CORES_DORA.laranjaEscuro}
                        />

                        <Text
                          style={{
                            color: CORES_DORA.laranjaEscuro,
                            fontWeight: '800',
                            fontSize: 12 * fontScale,
                          }}
                        >
                          {msg.atalho.rotulo}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {!ehDora && renderizarAvatarUsuario(38)}
                </View>

                {/* Sugestões de continuação */}
                {ehDora &&
                  msg.sugestoesContinuacao &&
                  msg.sugestoesContinuacao.length > 0 && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginLeft: 46,
                        marginTop: 8,
                      }}
                    >
                      {msg.sugestoesContinuacao.map((sug) => (
                        <TouchableOpacity
                          key={`${msg.id}-${sug}`}
                          onPress={() => enviarMensagem(sug)}
                          style={{
                            paddingHorizontal: 11,
                            paddingVertical: 7,
                            borderRadius: 18,
                            backgroundColor: CORES_DORA.branco,
                            borderWidth: 1,
                            borderColor: CORES_DORA.borda,
                          }}
                        >
                          <Text
                            style={{
                              color: CORES_DORA.texto,
                              fontSize: 11 * fontScale,
                              fontWeight: '700',
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

          {/* Indicador de processamento */}
          {processandoIa && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
              }}
            >
              {renderizarAvatarDora(32)}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: CORES_DORA.branco,
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: CORES_DORA.borda,
                  elevation: 1,
                }}
              >
                <ActivityIndicator
                  size="small"
                  color={CORES_DORA.laranjaPrincipal}
                />

                <Text
                  style={{
                    color: CORES_DORA.textoSuave,
                    fontSize: 12 * fontScale,
                    fontWeight: '600',
                  }}
                >
                  Dora está pensando com carinho... ✨
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Painel de comandos de voz */}
        {exibirComandosVoz && (
          <View
            style={{
              backgroundColor: CORES_DORA.branco,
              borderTopWidth: 1.5,
              borderColor: CORES_DORA.borda,
              padding: 12,
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                color: CORES_DORA.texto,
                fontSize: 12 * fontScale,
                marginBottom: 8,
              }}
            >
              🎙️ Toque em uma frase pronta ou use o microfone do seu teclado
              para falar comigo:
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {comandosRapidos.map((cmd) => (
                <TouchableOpacity
                  key={`voz-${cmd}`}
                  onPress={() => enviarMensagem(cmd)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 14,
                    backgroundColor: CORES_DORA.laranjaMuitoClaro,
                    borderWidth: 1,
                    borderColor: CORES_DORA.borda,
                  }}
                >
                  <Text
                    style={{
                      color: CORES_DORA.texto,
                      fontSize: 11.5 * fontScale,
                      fontWeight: '600',
                    }}
                  >
                    {cmd}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Barra inferior */}
        <View
          style={[
            estilosDora.barraInferiorChat,
            {
              backgroundColor: CORES_DORA.branco,
              borderTopColor: CORES_DORA.borda,
              borderTopWidth: 1,
              paddingVertical: 10,
            },
          ]}
        >
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir opções de comando de voz"
            onPress={() =>
              setExibirComandosVoz((ant) => !ant)
            }
            style={[
              estilosDora.botaoVoz,
              {
                backgroundColor: exibirComandosVoz
                  ? CORES_DORA.amarelo
                  : CORES_DORA.fundo,
                borderColor: exibirComandosVoz
                  ? CORES_DORA.laranja
                  : CORES_DORA.borda,
                borderRadius: 14,
              },
            ]}
          >
            <Feather
              name="mic"
              size={18}
              color={CORES_DORA.laranjaEscuro}
            />
          </TouchableOpacity>

          <TextInput
            placeholder="Converse com a Dora..."
            placeholderTextColor={CORES_DORA.textoSuave}
            value={entradaTexto}
            onChangeText={setEntradaTexto}
            onSubmitEditing={() => enviarMensagem()}
            accessible={true}
            accessibilityLabel="Campo de conversa com a assistente Dora"
            style={[
              estilosDora.campoDigitacao,
              {
                flex: 1,
                backgroundColor: CORES_DORA.fundo,
                borderColor: CORES_DORA.borda,
                borderRadius: 14,
                color: CORES_DORA.texto,
                fontSize: tokens.typography.fontSize.sm * fontScale,
              },
            ]}
          />

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem para a Dora"
            disabled={processandoIa}
            onPress={() => enviarMensagem()}
            style={[
              estilosDora.botaoEnviar,
              {
                backgroundColor: CORES_DORA.laranjaPrincipal,
                borderRadius: 14,
                opacity: processandoIa ? 0.6 : 1,
              },
            ]}
          >
            <AppIcon name="send" size={16} color="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: 13 * fontScale,
              }}
            >
              Enviar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Caixa de texto flutuante */}
        {exibirCaixaTextoFlutuante && (
          <View
            style={{
              position: 'absolute',
              right: 16,
              alignSelf: 'flex-end',
              bottom: 138,
              width: '88%',
              maxWidth: 380,
              zIndex: 21,
              elevation: 10,
              padding: 14,
              borderRadius: 20,
              backgroundColor: CORES_DORA.branco,
              borderWidth: 1.5,
              borderColor: CORES_DORA.borda,
              shadowColor: '#A65D20',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.16,
              shadowRadius: 8,
            }}
          >
            <Text
              style={{
                color: CORES_DORA.texto,
                fontWeight: '800',
                fontSize: 13 * fontScale,
                marginBottom: 8,
              }}
            >
              💬 Converse com a Dora
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TextInput
                autoFocus
                placeholder="Digite sua mensagem..."
                placeholderTextColor={CORES_DORA.textoSuave}
                value={entradaTexto}
                onChangeText={setEntradaTexto}
                onSubmitEditing={() => enviarMensagem()}
                returnKeyType="send"
                accessibilityLabel="Digite uma mensagem para a Dora"
                style={{
                  flex: 1,
                  minHeight: 44,
                  maxHeight: 100,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: CORES_DORA.borda,
                  backgroundColor: CORES_DORA.fundo,
                  color: CORES_DORA.texto,
                  fontSize: tokens.typography.fontSize.sm * fontScale,
                }}
              />

              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem para a Dora"
                disabled={!entradaTexto.trim() || processandoIa}
                onPress={() => enviarMensagem()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: CORES_DORA.laranjaPrincipal,
                  opacity:
                    !entradaTexto.trim() || processandoIa ? 0.55 : 1,
                }}
              >
                <Feather
                  name="send"
                  size={17}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botões flutuantes */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            right: 16,
            bottom: 78,
            zIndex: 9999,
            elevation: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Limpar conversa com a Dora"
            onPress={limparConversa}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingHorizontal: 13,
              paddingVertical: 13,
              borderRadius: 28,
              backgroundColor: CORES_DORA.vermelho,
              borderWidth: 2,
              borderColor: '#FFFFFF',
              opacity: pressed ? 0.75 : 1,
              cursor: 'pointer',
              boxShadow: '0px 3px 6px rgba(0,0,0,0.22)',
            } as any)}
          >
            <Feather
              name="trash-2"
              size={16}
              color="#FFFFFF"
            />

            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: 12 * fontScale,
              }}
            >
              Limpar
            </Text>
          </Pressable>

          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Falar com a Dora"
            onPress={() => {
              setExibirCaixaTextoFlutuante((aberto) => !aberto);
              setExibirComandosVoz(false);
              rolarParaFinal();
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              paddingHorizontal: 19,
              paddingVertical: 14,
              borderRadius: 30,
              backgroundColor: CORES_DORA.laranjaPrincipal,
              borderWidth: 2,
              borderColor: '#FFFFFF',
              opacity: pressed ? 0.8 : 1,
              cursor: 'pointer',
              elevation: 8,
              shadowColor: '#A65D20',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.22,
              shadowRadius: 6,
            } as any)}
          >
            <Feather
              name={
                exibirCaixaTextoFlutuante
                  ? 'x'
                  : 'message-circle'
              }
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: 12 * fontScale,
              }}
            >
              Fale com a Dora
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

