// src/app/dora.tsx
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

const obterHorarioAtual = (): string => {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export default function DoraScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const scrollRef = useRef<any>(null);

  // Dados da pessoa logada para exibir foto e nome nos balões de conversa
  const [nomeUsuario, setNomeUsuario] = useState('Você');
  const [fotoUsuario, setFotoUsuario] = useState<string | null>(null);
  const [erroFotoUsuario, setErroFotoUsuario] = useState(false);

  // Estados de conversa e dados reais do estoque
  const [entradaTexto, setEntradaTexto] = useState('');
  const [processandoIa, setProcessandoIa] = useState(false);
  const [lotesReais, setLotesReais] = useState<LoteEstoqueDora[]>([]);
  const [movimentacoesReais, setMovimentacoesReais] = useState<MovimentacaoEstoqueDora[]>([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);
  const [exibirComandosVoz, setExibirComandosVoz] = useState(false);
  const [ultimaReceitaId, setUltimaReceitaId] = useState<string | undefined>(undefined);

  const [historico, setHistorico] = useState<MensagemChat[]>([
    {
      id: 'msg-boas-vindas',
      autor: 'dora',
      horario: obterHorarioAtual(),
      texto:
        'Oi! Que alegria ter você por aqui! 😊💛\n\nEu sou a **Dora**, sua assistente inteligente aqui da Casa da Criança! Estou olhando nossas prateleiras agora mesmo para te ajudar com:\n\n🍲 **Receitas de verdade** usando só ingredientes que combinam entre si\n📈 **Previsões de consumo** para saber quanto tempo cada alimento vai durar\n⏰ **Avisos de validade** do que precisamos usar primeiro\n🧭 **Ajuda passo a passo** para usar qualquer função do aplicativo!\n\nToque em uma ideia abaixo ou me escreva o que você precisa! ✨',
      sugestoesContinuacao: [
        '🍲 Me sugere uma receita verdadeira?',
        '📈 Qual a previsão de consumo do estoque?',
        '⏰ O que vence nos próximos dias?',
        '📦 O que temos guardado nas prateleiras?',
        '🧭 Como uso as funções do aplicativo?',
      ],
    },
  ]);

  const comandosRapidos = [
    '🍲 Receita com itens do estoque',
    '📈 Previsão de consumo',
    '⏰ O que vence logo?',
    '📦 Resumo das prateleiras',
    '🧭 Como cadastrar entrada?',
    '🔄 Como mudar de prateleira?',
  ];

  // Escuta os dados da pessoa autenticada (foto e nome do Google / Firebase Auth)
  useEffect(() => {
    const desinscrever = auth.onAuthStateChanged((user) => {
      if (user) {
        const primeiroNome = (user.displayName || user.email?.split('@')[0] || 'Você').split(' ')[0];
        setNomeUsuario(primeiroNome);
        if (user.photoURL) {
          setFotoUsuario(user.photoURL);
          setErroFotoUsuario(false);
        }
      }
    });
    return () => desinscrever();
  }, []);

  const sincronizarEstoqueEMovimentacoes = useCallback(async () => {
    try {
      setCarregandoEstoque(true);
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        const ativos: LoteEstoqueDora[] = resposta.lotes
          .filter((l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0)
          .map((l: any) => {
            const dataVal = l.data_validade_lote || l.data_validade_rotulo || '';
            return {
              ...l,
              quantidade_atual_pacote: Number(l.quantidade_atual_pacote) || 0,
              data_validade_lote: dataVal,
              local_descricao: normalizarDescricaoPrateleira(
                l.local_descricao || l.id_local_armazenamento || 'Armário A - Prateleira 1'
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
      // Mantém estado atual caso sem conexão momentânea
    } finally {
      setCarregandoEstoque(false);
    }
  }, []);

  useEffect(() => {
    sincronizarEstoqueEMovimentacoes();
  }, [sincronizarEstoqueEMovimentacoes]);

  const rolarParaFinal = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const enviarMensagem = async (textoManual?: string) => {
    const perguntaFinal = (textoManual ?? entradaTexto).trim();
    if (!perguntaFinal || processandoIa) return;

    if (!textoManual) setEntradaTexto('');
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

    // Processa no motor inteligente de IA + Machine Learning da Dora conectado aos lotes e movimentações reais
    const respostaLocal = responderConversaDora(
      perguntaFinal,
      lotesReais,
      movimentacoesReais,
      ultimaReceitaId
    );

    if (respostaLocal.receita?.id) {
      setUltimaReceitaId(respostaLocal.receita.id);
    }

    // Tenta também enriquecer via endpoint /api/dora caso disponível, mantendo a resposta rica de ML e receitas
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
      // Continua normalmente com o motor inteligente conectado ao estoque real
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
    setProcessandoIa(false);
    rolarParaFinal();
  };

  /**
   * Renderiza texto com suporte a negrito (**texto**) sem exibir asteriscos crus na tela.
   */
  const renderizarTextoFormatado = (texto: string, corTexto: string) => {
    const partes = texto.split(/(\*\*.*?\*\*)/g);
    return (
      <Text
        style={[
          estilosDora.textoMensagem,
          { color: corTexto, fontSize: tokens.typography.fontSize.sm * fontScale },
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

  /**
   * Avatar acolhedor da Dora para o cabeçalho e para os balões de conversa.
   */
  const renderizarAvatarDora = (tamanho = 40) => (
    <View
      style={[
        estilosDora.avatarContainer,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: '#FEF3C7',
          borderWidth: 2,
          borderColor: tokens.colors.accentAmber500,
        },
      ]}
    >
      <Text style={{ fontSize: tamanho * 0.52 }}>👩🏽‍🍳</Text>
      <View style={estilosDora.indicadorOnline} />
    </View>
  );

  /**
   * Avatar com a foto real da pessoa logada (ou inicial personalizada caso não tenha foto no perfil).
   */
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
            style={{ width: tamanho - 4, height: tamanho - 4, borderRadius: (tamanho - 4) / 2 }}
            onError={() => setErroFotoUsuario(true)}
          />
        ) : (
          <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tamanho * 0.4 }}>
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
    <SafeAreaView style={[estilosDora.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Cabeçalho do Chat com Perfil da Dora e da Pessoa Logada */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: 10,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Voltar para a tela anterior"
                onPress={() => roteador.back()}
                style={{ padding: 6, marginRight: 2 }}
              >
                <Feather name="arrow-left" size={22} color={theme.primary} />
              </TouchableOpacity>

              {renderizarAvatarDora(44)}

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      fontWeight: '900',
                      color: theme.text,
                      fontSize: 16.5 * fontScale,
                    }}
                  >
                    Dora ✨
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#FEF3C7',
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: tokens.colors.accentAmber500,
                    }}
                  >
                    <Text
                      style={{
                        color: '#B45309',
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
                    color: theme.subtext,
                    fontSize: 11.5 * fontScale,
                    marginTop: 1,
                  }}
                  numberOfLines={1}
                >
                  {carregandoEstoque
                    ? 'Olhando as prateleiras agora...'
                    : `Online • ${totalPacotesAtivos} pacotes acompanhados no estoque`}
                </Text>
              </View>
            </View>

            {/* Botão de atualizar + Foto da pessoa logada */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Atualizar informações do estoque"
                onPress={sincronizarEstoqueEMovimentacoes}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather name="refresh-cw" size={15} color={theme.secondary} />
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

        {/* Área Rolável de Mensagens da Conversa */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={estilosDora.rolagem}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={rolarParaFinal}
        >
          {/* Pílulas de Perguntas Rápidas no Topo */}
          <View style={estilosDora.faixaExemplos}>
            <Text
              style={[
                estilosDora.rotuloExemplos,
                { color: theme.subtext, fontSize: 11.5 * fontScale },
              ]}
            >
              💡 Toque em um assunto para conversar com a Dora:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
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
                      backgroundColor: theme.surface,
                      borderColor: tokens.colors.accentAmber500,
                    },
                  ]}
                >
                  <Text style={[estilosDora.textoPilula, { color: theme.text, fontSize: 11.5 * fontScale }]}>
                    {cmd}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Lista de Balões de Conversa com Avatar da Dora e Foto do Usuário */}
          {historico.map((msg) => {
            const ehDora = msg.autor === 'dora';

            return (
              <View key={msg.id} style={{ marginBottom: 14 }}>
                <View
                  accessible={true}
                  accessibilityLabel={`${ehDora ? 'Dora disse' : `${nomeUsuario} disse`}: ${msg.texto}`}
                  style={[
                    estilosDora.linhaMensagem,
                    ehDora ? estilosDora.linhaMensagemDora : estilosDora.linhaMensagemUsuario,
                  ]}
                >
                  {/* Avatar da Dora à esquerda nas mensagens dela */}
                  {ehDora && renderizarAvatarDora(38)}

                  {/* Balão da Conversa */}
                  <View
                    style={[
                      estilosDora.balaoMensagem,
                      {
                        backgroundColor: ehDora ? theme.surface : theme.primary,
                        borderColor: ehDora ? tokens.colors.accentAmber500 : theme.primary,
                        borderBottomLeftRadius: ehDora ? 4 : 18,
                        borderBottomRightRadius: ehDora ? 18 : 4,
                      },
                    ]}
                  >
                    <View style={estilosDora.cabecalhoBalao}>
                      <Text
                        style={[
                          estilosDora.autorBalao,
                          {
                            color: ehDora ? '#B45309' : '#FFFFFF',
                            fontSize: 11.5 * fontScale,
                          },
                        ]}
                      >
                        {ehDora ? 'Dora 👩🏽‍🍳' : nomeUsuario}
                      </Text>
                      <Text
                        style={[
                          estilosDora.horarioBalao,
                          {
                            color: ehDora ? theme.subtext : '#E0E7FF',
                            fontSize: 10 * fontScale,
                          },
                        ]}
                      >
                        {msg.horario}
                      </Text>
                    </View>

                    {renderizarTextoFormatado(msg.texto, ehDora ? theme.text : '#FFFFFF')}

                    {/* Card Visual de Predição de Consumo (Machine Learning) */}
                    {msg.predicoes && msg.predicoes.length > 0 && (
                      <View
                        style={[
                          estilosDora.cartaoPredicoes,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontWeight: '800',
                            color: theme.primary,
                            fontSize: 12 * fontScale,
                            marginBottom: 2,
                          }}
                        >
                          📊 Resumo Visual de Duração do Estoque:
                        </Text>
                        {msg.predicoes.map((pred) => {
                          const porcentagemBarra = Math.min(100, Math.max(12, Math.round((pred.diasAutonomia / 30) * 100)));
                          const corBarra = pred.riscoVencerAntesDeAcabar
                            ? '#F59E0B'
                            : pred.precisaReposicaoBreve
                            ? '#EF4444'
                            : '#16A34A';

                          return (
                            <View
                              key={pred.nomeProduto}
                              style={[
                                estilosDora.itemPredicao,
                                { backgroundColor: theme.surface, borderColor: theme.border },
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
                                    color: theme.text,
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
                                  height: 6,
                                  backgroundColor: '#E2E8F0',
                                  borderRadius: 3,
                                  marginTop: 5,
                                  overflow: 'hidden',
                                }}
                              >
                                <View
                                  style={{
                                    width: `${porcentagemBarra}%`,
                                    height: '100%',
                                    backgroundColor: corBarra,
                                    borderRadius: 3,
                                  }}
                                />
                              </View>
                              <Text
                                style={{
                                  color: theme.subtext,
                                  fontSize: 10 * fontScale,
                                  marginTop: 4,
                                }}
                              >
                                Guardado em: {pred.prateleiras.join(', ')}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Card Estruturado de Receita Culinária Verdadeira */}
                    {msg.receita && (
                      <View
                        style={[
                          estilosDora.cartaoReceita,
                          { backgroundColor: theme.background, borderColor: theme.secondary },
                        ]}
                      >
                        <Text
                          style={[
                            estilosDora.tituloReceita,
                            { color: theme.secondary, fontSize: 13.5 * fontScale },
                          ]}
                        >
                          🍲 {msg.receita.titulo}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                          <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '600' }}>
                            ⏱️ Preparo: {msg.receita.tempoPreparo}
                          </Text>
                          <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '600' }}>
                            🍽️ Rende: {msg.receita.rendimento}
                          </Text>
                        </View>

                        <Text style={[estilosDora.topicoReceita, { color: theme.text, fontSize: 12 * fontScale }]}>
                          <Text style={{ fontWeight: 'bold', color: theme.primary }}>
                            📦 O que vamos usar das nossas prateleiras:{'\n'}
                          </Text>
                          {msg.receita.ingredientesEstoque}
                        </Text>

                        {msg.receita.ingredientesComplementares && (
                          <Text style={[estilosDora.topicoReceita, { color: theme.text, fontSize: 12 * fontScale }]}>
                            <Text style={{ fontWeight: 'bold' }}>
                              🧂 Para completar na cozinha:{'\n'}
                            </Text>
                            {msg.receita.ingredientesComplementares}
                          </Text>
                        )}

                        <Text style={[estilosDora.topicoReceita, { color: theme.text, fontSize: 12 * fontScale }]}>
                          <Text style={{ fontWeight: 'bold' }}>👩🏽‍🍳 Passo a passo com carinho:{'\n'}</Text>
                          {msg.receita.modoPreparo}
                        </Text>

                        {msg.receita.dicaDora && (
                          <View
                            style={{
                              backgroundColor: '#FEF3C7',
                              padding: 8,
                              borderRadius: 8,
                              marginBottom: 8,
                            }}
                          >
                            <Text style={{ color: '#92400E', fontSize: 11 * fontScale, fontWeight: '600' }}>
                              💡 {msg.receita.dicaDora}
                            </Text>
                          </View>
                        )}

                        <TouchableOpacity
                          accessible={true}
                          accessibilityRole="link"
                          accessibilityLabel={`Abrir receita completa em ${msg.receita.fonteNome}`}
                          onPress={() =>
                            Linking.openURL(msg.receita!.fonteUrl).catch(() => {})
                          }
                        >
                          <Text style={[estilosDora.linkFonte, { color: theme.primary, fontSize: 11.5 * fontScale }]}>
                            🔗 Ver inspiração completa: {msg.receita.fonteNome}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Botão de Atalho Direto para a Tela Explicada pela Dora */}
                    {msg.atalho && msg.atalho.rota !== '/dora' && (
                      <TouchableOpacity
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={msg.atalho.rotulo}
                        onPress={() => roteador.push(msg.atalho!.rota as any)}
                        style={{
                          marginTop: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          backgroundColor: `${theme.primary}15`,
                          borderColor: theme.primary,
                          borderWidth: 1,
                          borderRadius: 10,
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                        }}
                      >
                        <Feather name={msg.atalho.icone as any} size={15} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 12 * fontScale }}>
                          {msg.atalho.rotulo}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Foto da Pessoa Logada à direita nas mensagens enviadas por ela */}
                  {!ehDora && renderizarAvatarUsuario(38)}
                </View>

                {/* Sugestões de continuação da conversa logo abaixo da resposta da Dora */}
                {ehDora && msg.sugestoesContinuacao && msg.sugestoesContinuacao.length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginLeft: 46,
                      marginTop: 6,
                    }}
                  >
                    {msg.sugestoesContinuacao.map((sug) => (
                      <TouchableOpacity
                        key={`${msg.id}-${sug}`}
                        onPress={() => enviarMensagem(sug)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 14,
                          backgroundColor: theme.surface,
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                      >
                        <Text style={{ color: theme.primary, fontSize: 11 * fontScale, fontWeight: '700' }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              {renderizarAvatarDora(32)}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: theme.surface,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: tokens.colors.accentAmber500,
                }}
              >
                <ActivityIndicator size="small" color={tokens.colors.accentAmber500} />
                <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, fontWeight: '600' }}>
                  Dora está pensando com carinho... ✨
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Painel de Comando Rápido de Voz Acessível */}
        {exibirComandosVoz && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderTopWidth: 1.5,
              borderColor: tokens.colors.accentAmber500,
              padding: 12,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 12 * fontScale, marginBottom: 8 }}>
              🎙️ Toque em uma frase pronta ou use o microfone do seu teclado para falar comigo:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {comandosRapidos.map((cmd) => (
                <TouchableOpacity
                  key={`voz-${cmd}`}
                  onPress={() => enviarMensagem(cmd)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: `${tokens.colors.accentAmber500}20`,
                    borderWidth: 1,
                    borderColor: tokens.colors.accentAmber500,
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: 11.5 * fontScale, fontWeight: '600' }}>{cmd}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Barra Inferior de Conversa */}
        <View
          style={[
            estilosDora.barraInferiorChat,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir opções de comando de voz"
            onPress={() => setExibirComandosVoz((ant) => !ant)}
            style={[
              estilosDora.botaoVoz,
              {
                backgroundColor: exibirComandosVoz ? `${theme.secondary}20` : theme.background,
                borderColor: exibirComandosVoz ? theme.secondary : theme.border,
              },
            ]}
          >
            <Feather name="mic" size={18} color={exibirComandosVoz ? theme.secondary : theme.primary} />
          </TouchableOpacity>

          <TextInput
            placeholder="Converse com a Dora sobre receitas, estoque ou ajuda..."
            placeholderTextColor={theme.subtext}
            value={entradaTexto}
            onChangeText={setEntradaTexto}
            onSubmitEditing={() => enviarMensagem()}
            accessible={true}
            accessibilityLabel="Campo de conversa com a assistente Dora"
            style={[
              estilosDora.campoDigitacao,
              {
                flex: 1,
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
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
              { backgroundColor: tokens.colors.accentAmber500, opacity: processandoIa ? 0.6 : 1 },
            ]}
          >
            <AppIcon name="send" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 * fontScale }}>
              Enviar
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
