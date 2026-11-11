// src/app/audit.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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
import { estilosAudit } from '../styles/audit.styles';
import { requisicaoApi } from '../services/api';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';
import { auth } from '../services/firebaseConfig';
import { AppInput } from '../components/common/AppInput';
import { AppNumericInput } from '../components/common/AppNumericInput';
import { AppButton } from '../components/common/AppButton';

interface EventoLinhaTempo {
  id: string;
  categoriaAcao: string;
  icone: React.ComponentProps<typeof Feather>['name'];
  cor: string;
  titulo: string;
  detalhes: string;
  justificativa?: string;
  usuario: string;
  dataBruta: string;
  timestampMs: number;
  ehAjuste: boolean;
}

const formatarDataHoraBr = (dataIso?: string): string => {
  if (!dataIso) return 'Agora';
  const limpa = String(dataIso).trim();
  const dt = new Date(limpa);
  if (!isNaN(dt.getTime())) {
    const d = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const a = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${a} • ${hh}:${mm}`;
  }
  return limpa;
};

export default function AuditScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<any[]>([]);
  const [lotesSistema, setLotesSistema] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);

  const [modalBuscaLoteVisivel, setModalBuscaLoteVisivel] = useState(false);
  const [modalAjusteVisivel, setModalAjusteVisivel] = useState(false);

  const [termoBuscaLote, setTermoBuscaLote] = useState('');
  const [loteSelecionado, setLoteSelecionado] = useState<any | null>(null);
  const [quantidadeFisica, setQuantidadeFisica] = useState('');
  const [justificativaAjuste, setJustificativaAjuste] = useState('');
  const [processandoAjuste, setProcessandoAjuste] = useState(false);

  const corPrimaria = '#1E3A8A';
  const corSecundaria = '#10B981';

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);

      const [respMov, respEst, respLogs] = (await Promise.all([
        requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_movimentacoes' },
        }).catch(() => ({})),
        requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        }).catch(() => ({})),
        requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_logs_auditoria' },
        }).catch(() => ({})),
      ])) as any[];

      if (respMov?.sucesso && Array.isArray(respMov.movimentacoes)) {
        setMovimentacoes(respMov.movimentacoes);
      } else if (Array.isArray(respEst?.movimentacoes)) {
        setMovimentacoes(respEst.movimentacoes);
      }

      if (respLogs?.sucesso && Array.isArray(respLogs.logs)) {
        setLogsAuditoria(respLogs.logs);
      }

      if (respEst?.sucesso && Array.isArray(respEst.lotes)) {
        setLotesSistema(
          respEst.lotes.map((l: any) => ({
            ...l,
            local_descricao: normalizarDescricaoPrateleira(l.local_descricao),
          })),
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados de auditoria da AWS.');
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregarDados();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarDados]);

  const { saudeEstoque, eventosLinhaTempo } = useMemo(() => {
    const lista: EventoLinhaTempo[] = [];

    movimentacoes.forEach((m, idx) => {
      const tipoOp = String(m.tipo_operacao || m.operacao || 'movimentacao').toLowerCase();
      const nomeProd = String(m.nome_produto || m.nome || 'Produto');
      const lote = String(m.numero_codigo_lote || m.lote || 'S/L');
      const local = normalizarDescricaoPrateleira(m.local_descricao || m.local || 'Despensa');
      const qtd = Number(m.quantidade_movimentada_pacote ?? m.qtd ?? 0);
      const dataStr = String(m.data_hora_movimentacao || m.data || '');
      const usuario = String(m.id_usuario_responsavel || m.responsavel || 'Operador');
      const justificativa = String(m.justificativa_detalhe || m.justificativa || '');

      let categoriaAcao = 'Movimentação';
      let icone: React.ComponentProps<typeof Feather>['name'] = 'repeat';
      let cor = corPrimaria;
      let titulo = `${nomeProd} (${qtd} pcts)`;
      let ehAjuste = false;

      if (tipoOp.includes('entrada') || tipoOp.includes('cadastr')) {
        categoriaAcao = 'Entrada';
        icone = 'arrow-down-left';
        cor = corSecundaria;
        titulo = `Entrada: ${nomeProd} (+${qtd} pcts)`;
      } else if (tipoOp.includes('saida') || tipoOp.includes('baixa') || tipoOp.includes('perda')) {
        categoriaAcao = tipoOp.includes('perda') ? 'Perda / Descarte' : 'Saída';
        icone = 'arrow-up-right';
        cor = '#DC2626';
        titulo = `${categoriaAcao}: ${nomeProd} (-${qtd} pcts)`;
      } else if (tipoOp.includes('ajuste')) {
        categoriaAcao = 'Ajuste Físico';
        icone = 'sliders';
        cor = '#F59E0B';
        ehAjuste = true;
        titulo = `Auditoria: ${nomeProd} (Δ ${qtd} pcts)`;
      } else {
        titulo = `Transferência: ${nomeProd} (${qtd} pcts)`;
      }

      const ts = dataStr ? Date.parse(dataStr) : NaN;
      lista.push({
        id: String(m.id_movimentacao_estoque || m.id_movimentacao || `mov-${idx}`),
        categoriaAcao,
        icone,
        cor,
        titulo,
        detalhes: `Lote ${lote} • ${local}`,
        justificativa: justificativa || undefined,
        usuario,
        dataBruta: dataStr,
        timestampMs: isNaN(ts) ? 0 : ts,
        ehAjuste,
      });
    });

    logsAuditoria.forEach((log, idx) => {
      const dataStr = String(log.data_hora || log.criado_em || log.timestamp || '');
      const acaoNome = String(log.acao || log.evento || 'Ação de Sistema');
      const usuario = String(log.id_usuario || log.responsavel || 'Administrador');
      const ts = dataStr ? Date.parse(dataStr) : NaN;
      lista.push({
        id: String(log.id_log_auditoria || log.id || `log-${idx}`),
        categoriaAcao: 'Registro de Sistema',
        icone: 'shield',
        cor: corPrimaria,
        titulo: acaoNome,
        detalhes:
          typeof log.detalhes === 'string'
            ? log.detalhes
            : log.detalhes?.nome_categoria
              ? `Categoria: ${log.detalhes.nome_categoria}`
              : 'Evento registrado em log administrativo',
        usuario,
        dataBruta: dataStr,
        timestampMs: isNaN(ts) ? 0 : ts,
        ehAjuste: false,
      });
    });

    lista.sort((a, b) => b.timestampMs - a.timestampMs);

    const totalOperacoes = movimentacoes.length;
    const qtdAjustes = lista.filter((item) => item.ehAjuste).length;
    const acuracia =
      totalOperacoes > 0
        ? Math.max(0, Math.round(((totalOperacoes - qtdAjustes) / totalOperacoes) * 100))
        : 100;

    return {
      saudeEstoque: acuracia,
      eventosLinhaTempo: lista,
    };
  }, [movimentacoes, logsAuditoria]);

  const lotesFiltrados = useMemo(() => {
    const termo = termoBuscaLote.toLowerCase().trim();
    if (!termo) return lotesSistema.slice(0, 12);
    return lotesSistema
      .filter(
        (l) =>
          (l.nome_produto || '').toLowerCase().includes(termo) ||
          (l.numero_codigo_lote || '').toLowerCase().includes(termo) ||
          (l.local_descricao || '').toLowerCase().includes(termo) ||
          (l.codigo_barra_produto || '').includes(termo),
      )
      .slice(0, 15);
  }, [lotesSistema, termoBuscaLote]);

  const abrirModalAjuste = (lote: any) => {
    setLoteSelecionado(lote);
    setQuantidadeFisica(String(lote.quantidade_atual_pacote ?? 0));
    setJustificativaAjuste('');
    setModalBuscaLoteVisivel(false);
    setModalAjusteVisivel(true);
  };

  const confirmarAjusteFisico = async () => {
    const qtdFisicaNum = Number(quantidadeFisica);

    if (quantidadeFisica === '' || isNaN(qtdFisicaNum) || qtdFisicaNum < 0) {
      Alert.alert('Valor Inválido', 'Informe a quantidade exata encontrada na prateleira (0 ou mais).');
      return;
    }

    if (qtdFisicaNum === Number(loteSelecionado.quantidade_atual_pacote)) {
      Alert.alert('Sem Divergência', 'O saldo físico informado é igual ao do sistema. Nenhum ajuste necessário.');
      return;
    }

    if (!justificativaAjuste.trim()) {
      Alert.alert('Atenção', 'Informe o motivo ou observação sobre esta discrepância.');
      return;
    }

    setProcessandoAjuste(true);
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'ajustar_estoque',
          id_lote_produto: loteSelecionado.id_lote_produto,
          nova_quantidade: qtdFisicaNum,
          justificativa: justificativaAjuste,
          id_usuario: auth.currentUser?.email || 'Auditor',
        },
      });

      if (resposta?.sucesso) {
        setModalAjusteVisivel(false);
        Alert.alert(
          'Auditoria Concluída!',
          `Estoque corrigido com sucesso. Diferença de ${resposta.diferenca > 0 ? '+' : ''}${resposta.diferenca} pacote(s) registrada na linha do tempo.`,
          [{ text: 'OK', onPress: () => carregarDados() }],
        );
      } else {
        Alert.alert('Falha no Ajuste', resposta?.mensagem || 'Erro ao processar na AWS.');
      }
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Falha de comunicação.');
    } finally {
      setProcessandoAjuste(false);
    }
  };

  return (
    <SafeAreaView style={[estilosAudit.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={estilosAudit.rolagem}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={() => {
              setRecarregando(true);
              carregarDados();
            }}
            colors={[corPrimaria, corSecundaria]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => roteador.back()}
          style={estilosAudit.botaoVoltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Feather name="arrow-left" size={22} color={corPrimaria} />
          <Text style={[estilosAudit.textoBotaoVoltar, { color: corPrimaria, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosAudit.cabecalho}>
          <Text
            style={[
              estilosAudit.titulo,
              { color: corPrimaria, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Auditoria e Linha do Tempo
          </Text>
          <Text
            style={[
              estilosAudit.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            Rastreabilidade cronológica das ações dos usuários e conferência física de estoque.
          </Text>
        </View>

        {!carregando && (
          <View
            style={[
              estilosAudit.cardSaude,
              {
                backgroundColor: '#EFF6FF',
                borderColor: '#1E3A8A40',
              },
            ]}
          >
            <View
              style={[
                estilosAudit.indicadorBox,
                {
                  borderColor:
                    saudeEstoque >= 95 ? corSecundaria : saudeEstoque >= 80 ? '#F59E0B' : theme.danger,
                },
              ]}
            >
              <Text
                style={[
                  estilosAudit.indicadorTexto,
                  {
                    color:
                      saudeEstoque >= 95 ? '#059669' : saudeEstoque >= 80 ? '#D97706' : theme.danger,
                  },
                ]}
              >
                {saudeEstoque}%
              </Text>
            </View>
            <View style={estilosAudit.textoSaudeContainer}>
              <Text style={[estilosAudit.tituloSaude, { color: corPrimaria, fontSize: 14.5 * fontScale }]}>
                Precisão do Inventário
              </Text>
              <Text style={[estilosAudit.subtituloSaude, { color: '#1E40AF', fontSize: 12 * fontScale }]}>
                {saudeEstoque >= 95
                  ? 'Excelente! Estoque físico e sistema totalmente alinhados.'
                  : saudeEstoque >= 80
                    ? 'Bom índice, com ajustes pontuais registrados.'
                    : 'Atenção: divergências frequentes exigem conferência.'}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            setTermoBuscaLote('');
            setModalBuscaLoteVisivel(true);
          }}
          style={[estilosAudit.botaoAuditoria, { backgroundColor: corSecundaria }]}
          accessibilityRole="button"
          accessibilityLabel="Realizar Conferência Física"
        >
          <Feather name="check-square" size={20} color="#FFFFFF" />
          <Text style={[estilosAudit.botaoAuditoriaTexto, { color: '#FFFFFF', fontSize: 14 * fontScale }]}>
            Realizar Conferência Física
          </Text>
        </TouchableOpacity>

        <View style={estilosAudit.gradeAtalhos}>
          {[
            { titulo: 'Por Produto', rota: '/audit-product', icone: 'package' },
            { titulo: 'Por Operador', rota: '/audit-user', icone: 'user-check' },
            { titulo: 'Por Período', rota: '/audit-period', icone: 'calendar' },
            { titulo: 'Exportar Logs', rota: '/audit-export', icone: 'share' },
          ].map((atalho) => (
            <TouchableOpacity
              key={atalho.rota}
              accessible={true}
              accessibilityRole="button"
              onPress={() => roteador.push(atalho.rota as any)}
              style={[
                estilosAudit.cardAtalho,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
            >
              <Feather name={atalho.icone as any} size={17} color={corPrimaria} />
              <Text style={{ fontWeight: '700', color: theme.text, fontSize: 12.5 * fontScale }}>
                {atalho.titulo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={estilosAudit.tituloSecaoRow}>
          <Feather name="activity" size={18} color={corPrimaria} />
          <Text style={[estilosAudit.tituloSecao, { color: theme.text, fontSize: 15 * fontScale }]}>
            Linha do Tempo de Ações ({eventosLinhaTempo.length})
          </Text>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={corPrimaria} style={{ marginTop: 20 }} />
        ) : eventosLinhaTempo.length === 0 ? (
          <View
            style={[
              estilosAudit.emptyBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Feather name="clock" size={32} color={corSecundaria} />
            <Text style={[estilosAudit.emptyTitle, { color: theme.text, fontSize: 14 * fontScale }]}>
              Nenhuma ação registrada ainda
            </Text>
            <Text style={[estilosAudit.emptySubtitle, { color: theme.subtext, fontSize: 12 * fontScale }]}>
              Entradas, saídas, movimentações e ajustes físicos aparecerão em ordem cronológica aqui.
            </Text>
          </View>
        ) : (
          <View>
            {eventosLinhaTempo.map((evento, idx) => {
              const ultimo = idx === eventosLinhaTempo.length - 1;
              return (
                <View key={evento.id} style={estilosAudit.timelineItemRow}>
                  {/* Trilho vertical da linha do tempo */}
                  <View style={estilosAudit.timelineRailCol}>
                    <View
                      style={[
                        estilosAudit.timelineNodeCircle,
                        {
                          backgroundColor: `${evento.cor}18`,
                          borderColor: evento.cor,
                        },
                      ]}
                    >
                      <Feather name={evento.icone} size={15} color={evento.cor} />
                    </View>
                    {!ultimo && (
                      <View
                        style={[
                          estilosAudit.timelineLine,
                          { backgroundColor: theme.border },
                        ]}
                      />
                    )}
                  </View>

                  {/* Card do evento */}
                  <View style={estilosAudit.timelineCardCol}>
                    <View
                      style={[
                        estilosAudit.cardTimeline,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={estilosAudit.linhaTopoLog}>
                        <View
                          style={[
                            estilosAudit.badgeTipoAcao,
                            { backgroundColor: `${evento.cor}16` },
                          ]}
                        >
                          <Text
                            style={[
                              estilosAudit.badgeTipoTexto,
                              { color: evento.cor, fontSize: 10.5 * fontScale },
                            ]}
                          >
                            {evento.categoriaAcao}
                          </Text>
                        </View>
                        <Text
                          style={[
                            estilosAudit.textoDataLog,
                            { color: theme.subtext, fontSize: 10.5 * fontScale },
                          ]}
                        >
                          {formatarDataHoraBr(evento.dataBruta)}
                        </Text>
                      </View>

                      <Text
                        style={[
                          estilosAudit.textoTituloEvento,
                          { color: theme.text, fontSize: 13.5 * fontScale },
                        ]}
                      >
                        {evento.titulo}
                      </Text>

                      <Text
                        style={[
                          estilosAudit.textoMetadadosLog,
                          { color: theme.subtext, fontSize: 11.5 * fontScale },
                        ]}
                      >
                        {evento.detalhes}
                      </Text>

                      {evento.justificativa ? (
                        <Text
                          style={{
                            color: theme.text,
                            fontSize: 11.5 * fontScale,
                            marginTop: 5,
                            fontStyle: 'italic',
                          }}
                        >
                          Obs.: {evento.justificativa}
                        </Text>
                      ) : null}

                      <View
                        style={[
                          estilosAudit.rodapeLog,
                          { borderTopColor: theme.border },
                        ]}
                      >
                        <Feather name="user" size={12} color={corPrimaria} />
                        <Text
                          style={[
                            estilosAudit.textoResponsavelLog,
                            { color: theme.subtext, fontSize: 11 * fontScale },
                          ]}
                          numberOfLines={1}
                        >
                          {evento.usuario}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Selecionar Lote para Conferência Física */}
      <Modal
        visible={modalBuscaLoteVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalBuscaLoteVisivel(false)}
      >
        <View style={estilosAudit.modalOverlay}>
          <View
            style={[
              estilosAudit.modalCard,
              { borderColor: corPrimaria, borderWidth: 1.5, backgroundColor: theme.surface },
            ]}
          >
            <View style={estilosAudit.modalHeaderRow}>
              <Text style={[estilosAudit.modalTitulo, { color: corPrimaria, fontSize: 16 * fontScale }]}>
                Localizar Lote para Conferência
              </Text>
              <TouchableOpacity
                onPress={() => setModalBuscaLoteVisivel(false)}
                style={estilosAudit.botaoFecharModal}
                accessibilityRole="button"
                accessibilityLabel="Fechar busca de lote"
              >
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
              Selecione o lote conferido na prateleira.
            </Text>

            <View
              style={[
                estilosAudit.inputBuscaModal,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <Feather name="search" size={16} color={theme.subtext} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Ex: Arroz, Armário A, 78910..."
                placeholderTextColor={theme.subtext}
                value={termoBuscaLote}
                onChangeText={setTermoBuscaLote}
                style={{ flex: 1, color: theme.text }}
              />
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {lotesFiltrados.map((lote) => (
                <TouchableOpacity
                  key={lote.id_lote_produto}
                  onPress={() => abrirModalAjuste(lote)}
                  style={[
                    estilosAudit.itemListaLote,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[estilosAudit.textoLoteModal, { color: theme.text, fontSize: 13 * fontScale }]}
                    numberOfLines={1}
                  >
                    {lote.nome_produto}
                  </Text>
                  <View style={estilosAudit.linhaLoteModal}>
                    <Text style={{ color: theme.subtext, fontSize: 11.5 * fontScale }}>
                      Lote: {lote.numero_codigo_lote}
                    </Text>
                    <Text style={[estilosAudit.textoQtdModal, { color: corPrimaria, fontSize: 12 * fontScale }]}>
                      {lote.quantidade_atual_pacote} pct(s)
                    </Text>
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, marginTop: 2 }}>
                    {lote.local_descricao}
                  </Text>
                </TouchableOpacity>
              ))}
              {lotesFiltrados.length === 0 && (
                <Text style={{ textAlign: 'center', marginTop: 20, color: theme.subtext }}>
                  Nenhum lote ativo encontrado.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Conferência e Ajuste Físico */}
      <Modal
        visible={modalAjusteVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalAjusteVisivel(false)}
      >
        <View style={estilosAudit.modalOverlay}>
          <View
            style={[
              estilosAudit.modalCard,
              { borderColor: corPrimaria, borderWidth: 1.5, backgroundColor: theme.surface },
            ]}
          >
            <View style={estilosAudit.modalHeaderRow}>
              <Text style={[estilosAudit.modalTitulo, { color: corPrimaria, fontSize: 16 * fontScale }]}>
                Auditoria de Saldo
              </Text>
              <TouchableOpacity
                onPress={() => setModalAjusteVisivel(false)}
                style={estilosAudit.botaoFecharModal}
                accessibilityRole="button"
                accessibilityLabel="Fechar ajuste físico"
              >
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                estilosAudit.boxInfoAtual,
                { backgroundColor: '#EFF6FF', borderColor: '#1E3A8A30' },
              ]}
            >
              <Text style={{ fontWeight: '800', color: '#1E293B', fontSize: 14 * fontScale, textAlign: 'center' }}>
                {loteSelecionado?.nome_produto}
              </Text>
              <Text style={{ color: '#475569', fontSize: 11.5 * fontScale, marginTop: 4 }}>
                Lote: {loteSelecionado?.numero_codigo_lote} | {loteSelecionado?.local_descricao}
              </Text>
              <Text style={{ fontWeight: '900', color: corPrimaria, fontSize: 17 * fontScale, marginTop: 8 }}>
                Sistema informa: {loteSelecionado?.quantidade_atual_pacote} pcts
              </Text>
            </View>

            <AppNumericInput
              rotulo="Quantidade encontrada na prateleira:"
              placeholder="0"
              min={0}
              value={quantidadeFisica}
              onChangeText={setQuantidadeFisica}
            />

            <AppInput
              rotulo="Justificativa da diferença:"
              placeholder="Ex: Embalagem danificada não registrada."
              value={justificativaAjuste}
              onChangeText={setJustificativaAjuste}
            />

            <View style={{ marginTop: 10 }}>
              {processandoAjuste ? (
                <ActivityIndicator size="large" color={corPrimaria} />
              ) : (
                <AppButton
                  title="Confirmar Ajuste Físico"
                  variant="secondary"
                  onPress={confirmarAjusteFisico}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
