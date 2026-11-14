import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosNotificacoes } from '../styles/notifications.styles';
import { requisicaoApi } from '../services/api';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';
import { diasAteVencimento, parseDataLocal } from '../utils/dateValidation';

type TipoNotificacao =
  | 'vencido'
  | 'vencimento_proximo'
  | 'estoque_baixo'
  | 'entrada'
  | 'saida'
  | 'movimentacao'
  | 'ajuste'
  | 'campanha';

type FiltroCategoriaNotificacao =
  | 'todos'
  | 'alertas'
  | 'entrada'
  | 'saida'
  | 'movimentacao'
  | 'campanha';

type OrdenacaoNotificacao = 'prioridade' | 'recentes' | 'antigas' | 'az' | 'za';

interface NotificacaoSistema {
  id: string;
  tipo: TipoNotificacao;
  etiqueta: string;
  icone: React.ComponentProps<typeof Feather>['name'];
  cor: string;
  titulo: string;
  mensagem: string;
  dataLabel: string;
  timestampMs: number;
  prioridade: number;
  rotaDestino: string;
}

const CHAVE_DISPENSADAS = '@dg_notificacoes_dispensadas_v1';

const OPCOES_FILTRO_TIPO: { valor: FiltroCategoriaNotificacao; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todas' },
  { valor: 'alertas', rotulo: 'Alertas' },
  { valor: 'entrada', rotulo: 'Entradas' },
  { valor: 'saida', rotulo: 'Saídas' },
  { valor: 'movimentacao', rotulo: 'Movimentações' },
  { valor: 'campanha', rotulo: 'Campanhas' },
];

const OPCOES_ORDENACAO: {
  valor: OrdenacaoNotificacao;
  rotulo: string;
  icone: React.ComponentProps<typeof Feather>['name'];
}[] = [
  { valor: 'prioridade', rotulo: 'Urgência', icone: 'alert-circle' },
  { valor: 'recentes', rotulo: 'Mais recentes', icone: 'arrow-down' },
  { valor: 'antigas', rotulo: 'Mais antigas', icone: 'arrow-up' },
  { valor: 'az', rotulo: 'Título A–Z', icone: 'type' },
  { valor: 'za', rotulo: 'Título Z–A', icone: 'type' },
];

const normalizarTextoBusca = (texto: string): string =>
  (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const parseTimestampMs = (bruto?: string, fallback?: number): number => {
  const texto = String(bruto || '').trim();
  if (!texto) return fallback ?? 0;

  const dtCompleta = new Date(texto);
  if (!isNaN(dtCompleta.getTime())) {
    return dtCompleta.getTime();
  }

  const dtLocal = parseDataLocal(texto);
  if (dtLocal) {
    return dtLocal.getTime();
  }

  return fallback ?? 0;
};

const formatarDataCurta = (bruto?: string): string => {
  if (!bruto) return 'Hoje';
  const dt = new Date(bruto);
  if (isNaN(dt.getTime())) return String(bruto).slice(0, 16);
  const dia = String(dt.getDate()).padStart(2, '0');
  const mes = String(dt.getMonth() + 1).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} • ${hh}:${mm}`;
};

export default function NotificationsScreen() {
  const roteador = useRouter();
  const { theme, fontScale } = useAppTheme();

  const [notificacoesBrutas, setNotificacoesBrutas] = useState<NotificacaoSistema[]>([]);
  const [idsDispensados, setIdsDispensados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<FiltroCategoriaNotificacao>('todos');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>('prioridade');

  const carregarDispensadas = useCallback(async (): Promise<string[]> => {
    try {
      const json = await AsyncStorage.getItem(CHAVE_DISPENSADAS);
      const parsed = json ? JSON.parse(json) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const buscarNotificacoesSistema = useCallback(async () => {
    try {
      const [dispensadasSalvas, resEst, resMov, resCamp] = await Promise.all([
        carregarDispensadas(),
        requisicaoApi<any>('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        }).catch(() => ({})),
        requisicaoApi<any>('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_movimentacoes' },
        }).catch(() => ({})),
        requisicaoApi<any>('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_campanhas' },
        }).catch(() => ({})),
      ]);

      setIdsDispensados(dispensadasSalvas);

      const lista: NotificacaoSistema[] = [];

      const lotes: any[] = Array.isArray(resEst?.lotes)
        ? resEst.lotes
        : Array.isArray(resEst?.dados)
          ? resEst.dados
          : [];

      // 1. Produtos vencidos e próximos do vencimento + agrupamento para estoque baixo
      const mapaProdutosSaldo = new Map<
        string,
        { nome: string; total: number; minimo: number }
      >();

      const agoraMs = Date.now();

      lotes.forEach((lote, idx) => {
        const qtd = Number(lote.quantidade_atual_pacote || 0);
        if (qtd <= 0) return;

        const chaveProd = String(lote.id_produto || lote.nome_produto || idx);
        const nomeProd = String(lote.nome_produto || 'Alimento');
        const minimo = Number(lote.estoque_minimo_pacote || 5);
        const atual = mapaProdutosSaldo.get(chaveProd) || { nome: nomeProd, total: 0, minimo };
        atual.total += qtd;
        mapaProdutosSaldo.set(chaveProd, atual);

        const dataValStr = String(
          lote.data_validade_lote || lote.data_validade_rotulo || '',
        ).trim();
        const dias = diasAteVencimento(dataValStr);
        const localDesc = normalizarDescricaoPrateleira(
          lote.local_descricao || lote.id_local_armazenamento || 'Estoque Geral',
        );
        const timestampAlerta = parseTimestampMs(
          lote.data_entrada_lote || dataValStr,
          agoraMs,
        );

        if (dias !== null && dias < 0) {
          lista.push({
            id: `notif-vencido-${lote.id_lote_produto || idx}`,
            tipo: 'vencido',
            etiqueta: 'Produto Vencido',
            icone: 'alert-octagon',
            cor: '#DC2626',
            titulo: `${nomeProd} está vencido`,
            mensagem: `${qtd} pacote(s) em ${localDesc} (venceu há ${Math.abs(dias)} dia(s)). Remova do consumo imediatamente.`,
            dataLabel: 'Urgente',
            timestampMs: agoraMs - idx,
            prioridade: 1,
            rotaDestino: '/stock-remove',
          });
        } else if (dias !== null && dias <= 7) {
          lista.push({
            id: `notif-prox-${lote.id_lote_produto || idx}`,
            tipo: 'vencimento_proximo',
            etiqueta: 'Próximo do Vencimento',
            icone: 'clock',
            cor: '#F59E0B',
            titulo: `${nomeProd} vence ${dias === 0 ? 'hoje' : `em ${dias} dia(s)`}`,
            mensagem: `Lote ${lote.numero_codigo_lote || 'S/N'} (${qtd} pcts) guardado em ${localDesc}. Priorize a saída (FEFO).`,
            dataLabel: dias === 0 ? 'Hoje' : `Em ${dias}d`,
            timestampMs: timestampAlerta || agoraMs - idx,
            prioridade: 2,
            rotaDestino: '/stock-remove',
          });
        }
      });

      // 2. Estoque baixo
      mapaProdutosSaldo.forEach((info, chave) => {
        if (info.total <= info.minimo) {
          lista.push({
            id: `notif-baixo-${chave}`,
            tipo: 'estoque_baixo',
            etiqueta: 'Estoque Baixo',
            icone: 'trending-down',
            cor: '#D97706',
            titulo: `Estoque baixo de ${info.nome}`,
            mensagem: `Restam apenas ${info.total} pacote(s) (mínimo recomendado: ${info.minimo}).`,
            dataLabel: 'Reposição',
            timestampMs: agoraMs,
            prioridade: 3,
            rotaDestino: '/stock-add',
          });
        }
      });

      // 3. Movimentações do sistema: entradas, saídas, transferências e ajustes
      const movs: any[] = Array.isArray(resMov?.movimentacoes)
        ? resMov.movimentacoes
        : Array.isArray(resEst?.movimentacoes)
          ? resEst.movimentacoes
          : [];

      movs.slice(0, 25).forEach((mov, idx) => {
        const tipoOp = String(
          mov.tipo_operacao || mov.operacao || mov.acao || 'movimentacao',
        ).toLowerCase();
        const nomeProd = String(mov.nome_produto || mov.nome || 'Produto');
        const qtd = Number(mov.quantidade_movimentada_pacote || mov.qtd || 0);
        const localDesc = normalizarDescricaoPrateleira(
          mov.local_descricao || mov.local || 'Despensa Principal',
        );
        const responsavel = String(
          mov.id_usuario_responsavel || mov.responsavel || 'Equipe',
        );
        const dataHora = mov.data_hora_movimentacao || mov.data || '';
        const timestampMov = parseTimestampMs(dataHora, agoraMs - (idx + 1) * 60000);
        const idBase = String(mov.id_movimentacao || mov.id_movimentacao_estoque || idx);

        if (tipoOp.includes('entrada') || tipoOp.includes('cadastr')) {
          lista.push({
            id: `notif-mov-${idBase}`,
            tipo: 'entrada',
            etiqueta: 'Entrada no Estoque',
            icone: 'arrow-down-left',
            cor: '#10B981',
            titulo: `Entrada de ${nomeProd} (+${qtd} pcts)`,
            mensagem: `Registrado em ${localDesc} por ${responsavel}.`,
            dataLabel: formatarDataCurta(dataHora),
            timestampMs: timestampMov,
            prioridade: 4,
            rotaDestino: '/home',
          });
        } else if (tipoOp.includes('saida') || tipoOp.includes('baixa') || tipoOp.includes('perda')) {
          lista.push({
            id: `notif-mov-${idBase}`,
            tipo: 'saida',
            etiqueta: tipoOp.includes('perda') ? 'Baixa por Perda' : 'Saída do Estoque',
            icone: 'arrow-up-right',
            cor: '#DC2626',
            titulo: `Saída de ${nomeProd} (-${qtd} pcts)`,
            mensagem: `${mov.justificativa_detalhe || mov.motivo_saida || 'Retirada registrada'} • por ${responsavel}.`,
            dataLabel: formatarDataCurta(dataHora),
            timestampMs: timestampMov,
            prioridade: 4,
            rotaDestino: '/audit',
          });
        } else if (tipoOp.includes('ajuste')) {
          lista.push({
            id: `notif-mov-${idBase}`,
            tipo: 'ajuste',
            etiqueta: 'Ajuste de Auditoria',
            icone: 'sliders',
            cor: '#1E3A8A',
            titulo: `Ajuste físico em ${nomeProd}`,
            mensagem: `${mov.justificativa_detalhe || 'Conferência de prateleira'} • ${responsavel}.`,
            dataLabel: formatarDataCurta(dataHora),
            timestampMs: timestampMov,
            prioridade: 5,
            rotaDestino: '/audit',
          });
        } else {
          lista.push({
            id: `notif-mov-${idBase}`,
            tipo: 'movimentacao',
            etiqueta: 'Movimentação Interna',
            icone: 'repeat',
            cor: '#1E3A8A',
            titulo: `Transferência de ${nomeProd} (${qtd} pcts)`,
            mensagem: `Movido para ${localDesc} por ${responsavel}.`,
            dataLabel: formatarDataCurta(dataHora),
            timestampMs: timestampMov,
            prioridade: 5,
            rotaDestino: '/stock-move',
          });
        }
      });

      // 4. Campanhas de doação
      const campanhas: any[] = Array.isArray(resCamp?.campanhas) ? resCamp.campanhas : [];
      campanhas.forEach((camp, idx) => {
        const tituloCamp = String(camp.nome_campanha || camp.titulo || 'Campanha Solidária');
        const statusCamp = String(camp.status_campanha || 'Ativa');
        const idCamp = String(camp.id_campanha_doacao || idx);
        const dataCamp = camp.criada_em || camp.data_inicio_campanha;
        lista.push({
          id: `notif-camp-${idCamp}`,
          tipo: 'campanha',
          etiqueta: 'Campanha de Doação',
          icone: 'award',
          cor: '#1E3A8A',
          titulo: tituloCamp,
          mensagem: `${camp.objetivo_descricao_campanha || 'Campanha ativa para arrecadação de alimentos.'} (Status: ${statusCamp})`,
          dataLabel: formatarDataCurta(dataCamp),
          timestampMs: parseTimestampMs(dataCamp, agoraMs - 86400000),
          prioridade: 6,
          rotaDestino: '/settings-campaigns',
        });
      });

      lista.sort((a, b) => a.prioridade - b.prioridade);
      setNotificacoesBrutas(lista);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [carregarDispensadas]);

  useEffect(() => {
    buscarNotificacoesSistema();
  }, [buscarNotificacoesSistema]);

  const dispensarNotificacao = async (id: string) => {
    const atualizadas = idsDispensados.includes(id)
      ? idsDispensados
      : [...idsDispensados, id];
    setIdsDispensados(atualizadas);
    try {
      await AsyncStorage.setItem(CHAVE_DISPENSADAS, JSON.stringify(atualizadas));
    } catch {
      // Silencioso
    }
  };

  const restaurarDispensadas = async () => {
    setIdsDispensados([]);
    try {
      await AsyncStorage.removeItem(CHAVE_DISPENSADAS);
    } catch {
      // Silencioso
    }
  };

  const notificacoesVisiveis = useMemo(
    () => notificacoesBrutas.filter((item) => !idsDispensados.includes(item.id)),
    [notificacoesBrutas, idsDispensados],
  );

  const notificacoesFiltradas = useMemo(() => {
    const termo = normalizarTextoBusca(buscaTexto);

    const filtradas = notificacoesVisiveis.filter((item) => {
      if (filtroTipo === 'alertas') {
        if (
          item.tipo !== 'vencido' &&
          item.tipo !== 'vencimento_proximo' &&
          item.tipo !== 'estoque_baixo'
        ) {
          return false;
        }
      } else if (filtroTipo === 'movimentacao') {
        if (item.tipo !== 'movimentacao' && item.tipo !== 'ajuste') {
          return false;
        }
      } else if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) {
        return false;
      }

      if (termo) {
        const alvo = normalizarTextoBusca(
          `${item.titulo} ${item.mensagem} ${item.etiqueta} ${item.dataLabel}`,
        );
        if (!alvo.includes(termo)) {
          return false;
        }
      }

      return true;
    });

    return [...filtradas].sort((a, b) => {
      switch (ordenacao) {
        case 'recentes':
          return b.timestampMs - a.timestampMs || a.prioridade - b.prioridade;
        case 'antigas':
          return a.timestampMs - b.timestampMs || a.prioridade - b.prioridade;
        case 'az':
          return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
        case 'za':
          return b.titulo.localeCompare(a.titulo, 'pt-BR', { sensitivity: 'base' });
        case 'prioridade':
        default:
          return a.prioridade - b.prioridade || b.timestampMs - a.timestampMs;
      }
    });
  }, [notificacoesVisiveis, buscaTexto, filtroTipo, ordenacao]);

  const dispensarTodasNotificacoes = async () => {
    if (notificacoesFiltradas.length === 0) return;
    const idsParaDispensar = notificacoesFiltradas.map((item) => item.id);
    const atualizadas = Array.from(new Set([...idsDispensados, ...idsParaDispensar]));
    setIdsDispensados(atualizadas);
    try {
      await AsyncStorage.setItem(CHAVE_DISPENSADAS, JSON.stringify(atualizadas));
    } catch {
      // Silencioso
    }
  };

  const limparFiltros = () => {
    setBuscaTexto('');
    setFiltroTipo('todos');
    setOrdenacao('prioridade');
  };

  const possuiFiltroAtivo = buscaTexto.trim().length > 0 || filtroTipo !== 'todos';

  return (
    <SafeAreaView style={[estilosNotificacoes.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          estilosNotificacoes.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={estilosNotificacoes.headerEsquerda}>
          <TouchableOpacity
            onPress={() => roteador.back()}
            style={estilosNotificacoes.botaoIcone}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Feather name="arrow-left" size={22} color="#1E3A8A" />
          </TouchableOpacity>

          <View style={estilosNotificacoes.tituloWrapper}>
            <Text
              style={[
                estilosNotificacoes.titulo,
                { color: '#1E3A8A', fontSize: 19 * fontScale },
              ]}
            >
              Notificações
            </Text>
            <Text
              style={[
                estilosNotificacoes.subtitulo,
                { color: theme.subtext, fontSize: 12 * fontScale },
              ]}
            >
              {possuiFiltroAtivo
                ? `${notificacoesFiltradas.length} de ${notificacoesVisiveis.length} aviso(s)`
                : `${notificacoesVisiveis.length} aviso(s) do sistema`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => roteador.push('/notifications-config')}
          style={estilosNotificacoes.botaoIcone}
          accessibilityRole="button"
          accessibilityLabel="Configurar alertas de notificações"
        >
          <Feather name="settings" size={20} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      {/* Painel de Pesquisa, Filtro por Categoria e Ordenação */}
      <View
        style={[
          estilosNotificacoes.painelFiltros,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View
          style={[
            estilosNotificacoes.caixaBusca,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={18} color={theme.subtext} />
          <TextInput
            value={buscaTexto}
            onChangeText={setBuscaTexto}
            placeholder="Pesquisar notificações..."
            placeholderTextColor={theme.subtext}
            accessibilityLabel="Pesquisar notificações"
            style={[
              estilosNotificacoes.inputBusca,
              { color: theme.text, fontSize: 13.5 * fontScale },
            ]}
          />
          {buscaTexto.length > 0 && (
            <TouchableOpacity
              onPress={() => setBuscaTexto('')}
              style={estilosNotificacoes.botaoLimparBusca}
              accessibilityRole="button"
              accessibilityLabel="Limpar pesquisa"
            >
              <Feather name="x-circle" size={17} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilosNotificacoes.linhaChipsScroll}
        >
          {OPCOES_FILTRO_TIPO.map((op) => {
            const ativo = filtroTipo === op.valor;
            return (
              <TouchableOpacity
                key={op.valor}
                onPress={() => setFiltroTipo(op.valor)}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                style={[
                  estilosNotificacoes.chipFiltro,
                  {
                    backgroundColor: ativo ? '#1E3A8A' : theme.background,
                    borderColor: ativo ? '#1E3A8A' : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    estilosNotificacoes.textoChipFiltro,
                    {
                      color: ativo ? '#FFFFFF' : theme.text,
                      fontSize: 12 * fontScale,
                    },
                  ]}
                >
                  {op.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilosNotificacoes.linhaChipsScroll}
        >
          <View style={{ justifyContent: 'center', paddingRight: 4 }}>
            <Text style={{ color: theme.subtext, fontWeight: '700', fontSize: 11.5 * fontScale }}>
              Ordenar:
            </Text>
          </View>
          {OPCOES_ORDENACAO.map((op) => {
            const ativo = ordenacao === op.valor;
            return (
              <TouchableOpacity
                key={op.valor}
                onPress={() => setOrdenacao(op.valor)}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                style={[
                  estilosNotificacoes.chipFiltro,
                  {
                    backgroundColor: ativo ? '#10B98118' : theme.background,
                    borderColor: ativo ? '#10B981' : theme.border,
                  },
                ]}
              >
                <Feather name={op.icone} size={13} color={ativo ? '#047857' : theme.subtext} />
                <Text
                  style={[
                    estilosNotificacoes.textoChipFiltro,
                    {
                      color: ativo ? '#047857' : theme.subtext,
                      fontSize: 11.5 * fontScale,
                    },
                  ]}
                >
                  {op.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={estilosNotificacoes.scrollConteudo}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              buscarNotificacoesSistema();
            }}
            colors={['#1E3A8A', '#10B981']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!carregando && notificacoesFiltradas.length > 0 && (
          <View style={estilosNotificacoes.barraAcoesLista}>
            <Text style={{ color: theme.subtext, fontWeight: '700', fontSize: 12 * fontScale }}>
              Exibindo {notificacoesFiltradas.length} notificação(ões)
            </Text>

            <TouchableOpacity
              onPress={dispensarTodasNotificacoes}
              accessibilityRole="button"
              accessibilityLabel="Tirar todas as notificações de uma vez"
              style={[
                estilosNotificacoes.botaoLimparTodas,
                { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              ]}
            >
              <Feather name="trash-2" size={14} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: 12 * fontScale }}>
                {possuiFiltroAtivo
                  ? `Tirar filtradas (${notificacoesFiltradas.length})`
                  : 'Tirar todas'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {carregando ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 32 }} />
        ) : notificacoesVisiveis.length === 0 ? (
          <View
            style={[
              estilosNotificacoes.estadoVazio,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Feather name="bell-off" size={32} color="#10B981" />
            <Text
              style={{
                color: theme.text,
                fontWeight: '800',
                fontSize: 15 * fontScale,
                marginTop: 12,
              }}
            >
              Nenhuma notificação pendente
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 12.5 * fontScale,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Todos os avisos recentes de entradas, saídas, validades e campanhas foram lidos.
            </Text>
          </View>
        ) : notificacoesFiltradas.length === 0 ? (
          <View
            style={[
              estilosNotificacoes.estadoVazio,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Feather name="search" size={30} color="#1E3A8A" />
            <Text
              style={{
                color: theme.text,
                fontWeight: '800',
                fontSize: 15 * fontScale,
                marginTop: 12,
              }}
            >
              Nenhum resultado encontrado
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 12.5 * fontScale,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Tente outro termo de pesquisa ou limpe os filtros selecionados.
            </Text>
            <TouchableOpacity
              onPress={limparFiltros}
              style={[
                estilosNotificacoes.botaoRestaurar,
                { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', marginTop: 14 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Limpar filtros de pesquisa"
            >
              <Feather name="x" size={15} color="#1E3A8A" />
              <Text style={{ color: '#1E3A8A', fontWeight: '700', fontSize: 12.5 * fontScale }}>
                Limpar filtros
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          notificacoesFiltradas.map((item) => (
            <View
              key={item.id}
              style={[
                estilosNotificacoes.cardNotificacao,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderLeftColor: item.cor,
                },
              ]}
            >
              <View
                style={[
                  estilosNotificacoes.iconeTipoBox,
                  { backgroundColor: `${item.cor}16` },
                ]}
              >
                <Feather name={item.icone} size={20} color={item.cor} />
              </View>

              <TouchableOpacity
                onPress={() => roteador.push(item.rotaDestino as any)}
                style={estilosNotificacoes.conteudoCard}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${item.etiqueta}: ${item.titulo}`}
              >
                <View style={estilosNotificacoes.topoCardRow}>
                  <View
                    style={[
                      estilosNotificacoes.badgeTipo,
                      { backgroundColor: `${item.cor}18` },
                    ]}
                  >
                    <Text
                      style={[
                        estilosNotificacoes.badgeTipoTexto,
                        { color: item.cor, fontSize: 10.5 * fontScale },
                      ]}
                    >
                      {item.etiqueta}
                    </Text>
                  </View>

                  <Text
                    style={[
                      estilosNotificacoes.dataTexto,
                      { color: theme.subtext, fontSize: 11 * fontScale },
                    ]}
                  >
                    {item.dataLabel}
                  </Text>
                </View>

                <Text
                  style={[
                    estilosNotificacoes.tituloCard,
                    { color: theme.text, fontSize: 14 * fontScale },
                  ]}
                >
                  {item.titulo}
                </Text>

                <Text
                  style={[
                    estilosNotificacoes.mensagemCard,
                    { color: theme.subtext, fontSize: 12.5 * fontScale },
                  ]}
                >
                  {item.mensagem}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => dispensarNotificacao(item.id)}
                style={estilosNotificacoes.botaoDismiss}
                accessibilityRole="button"
                accessibilityLabel={`Dispensar notificação ${item.titulo}`}
              >
                <Feather name="x" size={19} color={theme.subtext} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {idsDispensados.length > 0 && (
          <TouchableOpacity
            onPress={restaurarDispensadas}
            style={[
              estilosNotificacoes.botaoRestaurar,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Restaurar notificações dispensadas"
          >
            <Feather name="rotate-ccw" size={16} color="#1E3A8A" />
            <Text style={{ color: '#1E3A8A', fontWeight: '700', fontSize: 12.5 * fontScale }}>
              Restaurar {idsDispensados.length} aviso(s) dispensado(s)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
