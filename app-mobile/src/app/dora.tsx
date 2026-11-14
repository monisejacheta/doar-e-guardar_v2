import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { estilosDora } from '../styles/dora.styles';
import { requisicaoApi } from '../services/api';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';
import {
  LoteEstoqueDora,
  MovimentacaoEstoqueDora,
  calcularDiasAteVencimento,
  responderConversaDora,
} from '../services/doraService';
import { DoraHeader } from '../components/dora/DoraHeader';
import { DoraMessageBubble } from '../components/dora/DoraMessageBubble';
import { DoraComposer } from '../components/dora/DoraComposer';
import { DoraAboutModal } from '../components/dora/DoraAboutModal';
import {
  AVATAR_DORA_ASSET,
  MensagemChat,
  criarCoresChatDora,
  criarMensagemBoasVindas,
  obterHorarioAtual,
} from '../components/dora/types';

export default function DoraScreen() {
  const roteador = useRouter();
  const { theme, mode, fontScale } = useAppTheme();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
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

  const coresChat = useMemo(() => criarCoresChatDora(theme, mode), [theme, mode]);

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

  const rolarParaFinal = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  const limparConversa = useCallback(() => {
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
  }, []);

  const enviarMensagem = useCallback(
    async (textoManual?: string) => {
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
        setHistorico((anterior) => [
          ...anterior,
          {
            id: `dora-${contadorIdRef.current}`,
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
          setHistorico((anterior) => [
            ...anterior,
            {
              id: `erro-${contadorIdRef.current}`,
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
    },
    [entradaTexto, processandoIa, lotesReais, movimentacoesReais, ultimaReceitaId, rolarParaFinal],
  );

  return (
    <SafeAreaView style={[estilosDora.tela, { backgroundColor: coresChat.canvas }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <DoraHeader
          coresChat={coresChat}
          processandoIa={processandoIa}
          carregandoEstoque={carregandoEstoque}
          totalPacotesAtivos={totalPacotesAtivos}
          onVoltar={() => roteador.back()}
          onAbrirSobre={() => setModalSobreDoraVisivel(true)}
          onSincronizar={sincronizarEstoqueEMMovimentacoes}
          onLimparConversa={limparConversa}
        />

        <ScrollView
          ref={scrollRef}
          style={estilosDora.listaChat}
          contentContainerStyle={estilosDora.listaChatConteudo}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilosDora.divisorDataWrapper}>
            <View style={[estilosDora.divisorDataPill, { backgroundColor: coresChat.divisorBg }]}>
              <Text
                style={[
                  estilosDora.divisorDataTexto,
                  { color: coresChat.divisorTexto, fontSize: 10.5 * fontScale },
                ]}
              >
                HOJE • DOAR & GUARDAR
              </Text>
            </View>
          </View>

          {historico.map((msg, indice) => (
            <DoraMessageBubble
              key={msg.id}
              mensagem={msg}
              ehUltimaMensagem={indice === historico.length - 1}
              coresChat={coresChat}
              onAbrirSobre={() => setModalSobreDoraVisivel(true)}
              onNavegarAtalho={(rota) => roteador.push(rota as any)}
              onSelecionarSugestao={(sug) => enviarMensagem(sug)}
            />
          ))}

          {processandoIa && (
            <View style={estilosDora.linhaMensagemDora}>
              <Image
                source={AVATAR_DORA_ASSET}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#10B981',
                  backgroundColor: '#D1FAE5',
                }}
                resizeMode="cover"
                accessibilityLabel="Avatar da assistente Dora"
              />
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

        <DoraComposer
          entradaTexto={entradaTexto}
          processandoIa={processandoIa}
          exibirComandosVoz={exibirComandosVoz}
          coresChat={coresChat}
          onChangeTexto={setEntradaTexto}
          onToggleComandosVoz={() => setExibirComandosVoz((v) => !v)}
          onEnviar={enviarMensagem}
        />
      </KeyboardAvoidingView>

      <DoraAboutModal
        visible={modalSobreDoraVisivel}
        coresChat={coresChat}
        onClose={() => setModalSobreDoraVisivel(false)}
      />
    </SafeAreaView>
  );
}
