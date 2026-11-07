// app-mobile/src/app/stock-move.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { estilosStockMove } from '../styles/stock-move.styles';
import { requisicaoApi } from '../services/api';
import { auth } from '../services/firebaseConfig';
import {
  LocalArmazenamento,
  carregarPrateleirasAws,
  mesmaPrateleira,
  normalizarDescricaoPrateleira,
  resolverPrateleiraPorDescricaoOuId,
  sanitizarLoteParaAws,
} from '../services/storageLocations';

interface LoteItem {
  id_lote_produto: string;
  id_produto: string;
  nome_produto: string;
  categoria: string;
  codigo_barra_produto: string;
  numero_codigo_lote: string;
  quantidade_inicial_pacote?: number;
  quantidade_atual_pacote: number;
  data_validade_lote: string;
  id_local_armazenamento?: string;
  local_descricao: string;
  local_descricao_original?: string;
  foto_url?: string;
  url_foto_produto?: string;
  data_ms: number;
}

interface ProdutoAgrupado {
  codigo_barra_produto: string;
  nome_produto: string;
  categoria: string;
  quantidade_total: number;
  foto_url?: string;
  lotes: LoteItem[];
}

interface ResumoMovimentacao {
  produto: string;
  qtdMovida: number;
  localOrigem: string;
  loteOriginal: string;
  localDestino: string;
  novoLote: string;
  qtdRestante: number;
}

export default function StockMoveScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const { width: larguraJanela } = useWindowDimensions();

  const [permissaoCamera, solicitarPermissaoCamera] = useCameraPermissions();
  const [scannerAberto, setScannerAberto] = useState(false);
  const bloqueioLeituraRef = useRef(false);

  const [lotesRaw, setLotesRaw] = useState<LoteItem[]>([]);
  const [prateleirasAws, setPrateleirasAws] = useState<LocalArmazenamento[]>([]);
  const [discrepanciasDetectadas, setDiscrepanciasDetectadas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroPrateleira, setFiltroPrateleira] = useState<string>('TODAS');
  const [modoExibicao, setModoExibicao] = useState<'lista' | 'grid'>('lista');

  // Estados dos Modais Principais
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);
  const [modalLotesVisivel, setModalLotesVisivel] = useState(false);

  const [loteSelecionado, setLoteSelecionado] = useState<LoteItem | null>(null);
  const [modalMoverVisivel, setModalMoverVisivel] = useState(false);

  // Estados do Formulário de Transferência
  const [quantidadeMover, setQuantidadeMover] = useState('');
  const [prateleiraDestino, setPrateleiraDestino] = useState<LocalArmazenamento | null>(null);
  const [erroFormularioMover, setErroFormularioMover] = useState<string | null>(null);
  const [processandoMovimentacao, setProcessandoMovimentacao] = useState(false);

  // Modais Customizados (substituem Alert.alert para funcionamento em Web, Android e iOS)
  const [modalPerguntaDivisao, setModalPerguntaDivisao] = useState(false);
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [resumoMovimentacao, setResumoMovimentacao] = useState<ResumoMovimentacao | null>(null);
  const [modalAvisoGenerico, setModalAvisoGenerico] = useState<{
    visivel: boolean;
    titulo: string;
    mensagem: string;
  }>({ visivel: false, titulo: '', mensagem: '' });

  const corAzulPrincipal = '#2563EB';
  const corAzulFundo = '#EFF6FF';
  const corAzulBorda = '#BFDBFE';

  const obterPlaceholderPorCategoria = (categoria: string) => {
    const cat = (categoria || '').toLowerCase();
    try {
      if (cat.includes('lati') || cat.includes('leite')) return require('../../assets/images/placeholder_laticinios.png');
      if (cat.includes('grão') || cat.includes('arroz') || cat.includes('feij')) return require('../../assets/images/placeholder_graos.png');
      if (cat.includes('massa') || cat.includes('macarr')) return require('../../assets/images/placeholder_massas.png');
      if (cat.includes('óleo') || cat.includes('oleo') || cat.includes('gordura')) return require('../../assets/images/placeholder_oleos.png');
      return require('../../assets/images/placeholder_geral.png');
    } catch {
      return require('../../assets/images/placeholder_geral.png');
    }
  };

  const converterDataParaMs = (dataStr: string) => {
    if (!dataStr) return 9999999999999;
    if (dataStr.includes('/')) {
      const [d, m, y] = dataStr.split('/');
      return new Date(`${y}-${m}-${d}T00:00:00`).getTime();
    }
    return new Date(`${dataStr}T00:00:00`).getTime();
  };

  const avaliarStatusLote = (dataLoteStr: string) => {
    if (!dataLoteStr) return 'regular';
    let dataVal: Date;
    if (dataLoteStr.includes('/')) {
      const [d, m, y] = dataLoteStr.split('/');
      dataVal = new Date(`${y}-${m}-${d}T00:00:00`);
    } else {
      dataVal = new Date(`${dataLoteStr}T00:00:00`);
    }
    if (!isNaN(dataVal.getTime())) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const diffDias = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDias < 0) return 'vencido';
      if (diffDias <= 7) return 'proximo_vencimento';
    }
    return 'regular';
  };

  const carregarEstoqueEPrateleiras = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      const lotesBrutos = resposta?.sucesso && Array.isArray(resposta.lotes) ? resposta.lotes : [];
      const reconciliacao = await carregarPrateleirasAws(lotesBrutos);

      const lotesProcessados: LoteItem[] = reconciliacao.lotesNormalizados
        .filter((l: any) => Number(l.quantidade_atual_pacote) > 0)
        .map((l: any) => ({
          ...l,
          data_ms: converterDataParaMs(l.data_validade_lote),
          quantidade_atual_pacote: Number(l.quantidade_atual_pacote),
        }));

      setPrateleirasAws(reconciliacao.locais);
      setDiscrepanciasDetectadas(reconciliacao.discrepanciasCorrigidas);
      setLotesRaw(lotesProcessados);
    } catch {
      setModalAvisoGenerico({
        visivel: true,
        titulo: 'Erro de Conexão',
        mensagem: 'Falha ao buscar o estoque e as prateleiras cadastradas na AWS.',
      });
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstoqueEPrateleiras();
  }, [carregarEstoqueEPrateleiras]);

  const catalogoAgrupado = useMemo(() => {
    const mapa = new Map<string, ProdutoAgrupado>();

    lotesRaw.forEach((lote) => {
      if (filtroPrateleira !== 'TODAS' && !mesmaPrateleira(lote.local_descricao, filtroPrateleira)) {
        return;
      }
      const ean = lote.codigo_barra_produto || lote.id_produto;
      const foto = lote.url_foto_produto || lote.foto_url;

      if (!mapa.has(ean)) {
        mapa.set(ean, {
          codigo_barra_produto: ean,
          nome_produto: lote.nome_produto,
          categoria: lote.categoria,
          quantidade_total: 0,
          foto_url: foto,
          lotes: [],
        });
      }
      const prod = mapa.get(ean)!;
      prod.quantidade_total += lote.quantidade_atual_pacote;
      prod.lotes.push(lote);
    });

    const lista = Array.from(mapa.values());
    lista.forEach((p) => p.lotes.sort((a, b) => a.data_ms - b.data_ms));
    return lista.sort((a, b) => a.nome_produto.localeCompare(b.nome_produto));
  }, [lotesRaw, filtroPrateleira]);

  const produtosFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();
    if (!termo) return catalogoAgrupado;
    return catalogoAgrupado.filter(
      (p) =>
        p.nome_produto.toLowerCase().includes(termo) ||
        p.codigo_barra_produto.includes(termo) ||
        p.categoria.toLowerCase().includes(termo) ||
        p.lotes.some(
          (l) =>
            l.local_descricao.toLowerCase().includes(termo) ||
            l.numero_codigo_lote.toLowerCase().includes(termo)
        )
    );
  }, [catalogoAgrupado, pesquisa]);

  const iniciarFluxoMover = (lote: LoteItem) => {
    setLoteSelecionado(lote);
    setQuantidadeMover(String(lote.quantidade_atual_pacote));
    setPrateleiraDestino(null);
    setErroFormularioMover(null);
    setModalLotesVisivel(false);
    setModalMoverVisivel(true);
  };

  const abrirLeitorCodigoBarras = async () => {
    if (!permissaoCamera?.granted) {
      const permissao = await solicitarPermissaoCamera();
      if (!permissao.granted) {
        setModalAvisoGenerico({
          visivel: true,
          titulo: 'Permissão de Câmera Necessária',
          mensagem: 'Autorize o uso da câmera para localizar o produto rapidamente pelo código de barras.',
        });
        return;
      }
    }
    bloqueioLeituraRef.current = false;
    setScannerAberto(true);
  };

  const aoLerCodigoCamera = ({ data }: { data: string }) => {
    if (bloqueioLeituraRef.current) return;
    const eanLido = (data || '').replace(/\D/g, '');
    if (eanLido.length < 8) return;

    bloqueioLeituraRef.current = true;
    setScannerAberto(false);
    setPesquisa(eanLido);

    const encontrado = catalogoAgrupado.find((p) => p.codigo_barra_produto === eanLido);
    if (encontrado) {
      setProdutoSelecionado(encontrado);
      setModalLotesVisivel(true);
    } else {
      setModalAvisoGenerico({
        visivel: true,
        titulo: 'Produto Não Encontrado no Estoque',
        mensagem: `Nenhum lote ativo com o código EAN ${eanLido} foi encontrado para movimentação.`,
      });
    }
  };

  const qtdNumerica = Number(quantidadeMover) || 0;
  const vaiDividirLote =
    loteSelecionado !== null &&
    qtdNumerica > 0 &&
    qtdNumerica < loteSelecionado.quantidade_atual_pacote;

  const validarEIniciarTransferencia = () => {
    if (!loteSelecionado) return;
    setErroFormularioMover(null);

    if (!quantidadeMover || isNaN(qtdNumerica) || qtdNumerica <= 0) {
      setErroFormularioMover('Informe uma quantidade válida maior que zero para transferir.');
      return;
    }

    if (qtdNumerica > loteSelecionado.quantidade_atual_pacote) {
      setErroFormularioMover(
        `Saldo insuficiente: o lote possui apenas ${loteSelecionado.quantidade_atual_pacote} pacote(s) em "${loteSelecionado.local_descricao}".`
      );
      return;
    }

    if (!prateleiraDestino) {
      setErroFormularioMover('Selecione uma das prateleiras abaixo como destino da transferência.');
      return;
    }

    if (mesmaPrateleira(prateleiraDestino.local_descricao, loteSelecionado.local_descricao)) {
      setErroFormularioMover(
        `Este lote já está alocado em "${prateleiraDestino.local_descricao}". Escolha uma prateleira de destino diferente.`
      );
      return;
    }

    if (vaiDividirLote) {
      setModalMoverVisivel(false);
      setModalPerguntaDivisao(true);
    } else {
      dispararRequisicaoApi(qtdNumerica, prateleiraDestino);
    }
  };

  const dispararRequisicaoApi = async (qtdMover: number, destino: LocalArmazenamento) => {
    if (!loteSelecionado) return;

    setModalPerguntaDivisao(false);
    setProcessandoMovimentacao(true);
    setErroFormularioMover(null);

    const usuarioResponsavel = auth.currentUser?.email || 'Operador Mobile';
    const localCanonicoDestino = resolverPrateleiraPorDescricaoOuId(
      destino.local_descricao,
      prateleirasAws
    );
    const localOrigemFormatado = normalizarDescricaoPrateleira(loteSelecionado.local_descricao);

    try {
      // 1. Sanitiza o lote de origem para evitar campos de UI no DynamoDB e executa a baixa no local de origem
      const loteOrigemLimpo = sanitizarLoteParaAws(loteSelecionado);

      const respSaida: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'saida_produto',
          id_lote_produto: loteSelecionado.id_lote_produto,
          lote: loteOrigemLimpo,
          quantidade: qtdMover,
          motivo_saida: 'saída - movimentação estoque',
          justificativa: `Transferido para: ${localCanonicoDestino.local_descricao}`,
          id_usuario: usuarioResponsavel,
        },
      });

      if (!respSaida || !respSaida.sucesso) {
        throw new Error(respSaida?.mensagem || 'Falha ao dar baixa no lote de origem na AWS.');
      }

      // 2. Gera um novo ID exclusivo e código de lote rastreável para a prateleira de destino
      const sufixoUnico = String(Date.now()).slice(-3);
      const codigoOriginal = (loteSelecionado.numero_codigo_lote || 'LOTE').split('-MOV')[0];
      const novoCodigoLote = `${codigoOriginal}-MOV${sufixoUnico}`;
      const idExclusivoNovoLote = `lote_mov_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .substring(2, 5)}`;

      const loteParaEntrada = {
        ...loteOrigemLimpo,
        id_lote_produto: idExclusivoNovoLote,
        id_local_armazenamento: localCanonicoDestino.id_local_armazenamento,
        local_descricao: localCanonicoDestino.local_descricao,
        numero_codigo_lote: novoCodigoLote,
        quantidade_inicial_pacote: qtdMover,
        quantidade_atual_pacote: qtdMover,
      };

      const respEntrada: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'cadastrar_lote',
          lote: loteParaEntrada,
          id_usuario: usuarioResponsavel,
        },
      });

      if (!respEntrada || !respEntrada.sucesso) {
        throw new Error(respEntrada?.mensagem || 'Erro ao alocar os pacotes na prateleira de destino na AWS.');
      }

      const qtdRestante = loteSelecionado.quantidade_atual_pacote - qtdMover;

      setModalMoverVisivel(false);
      setResumoMovimentacao({
        produto: loteSelecionado.nome_produto,
        qtdMovida: qtdMover,
        localOrigem: localOrigemFormatado,
        loteOriginal: loteSelecionado.numero_codigo_lote,
        localDestino: localCanonicoDestino.local_descricao,
        novoLote: novoCodigoLote,
        qtdRestante,
      });
      setModalSucessoVisivel(true);
    } catch (erro: any) {
      setModalMoverVisivel(false);
      setModalAvisoGenerico({
        visivel: true,
        titulo: 'Falha na Movimentação',
        mensagem: erro?.message || 'Não foi possível concluir a transferência na AWS.',
      });
    } finally {
      setProcessandoMovimentacao(false);
    }
  };

  const finalizarFluxo = () => {
    setModalSucessoVisivel(false);
    setLoteSelecionado(null);
    setProdutoSelecionado(null);
    setPrateleiraDestino(null);
    setErroFormularioMover(null);
    carregarEstoqueEPrateleiras(true);
  };

  const paddingLateral = 16;
  const espacoEntreCards = 8;
  const larguraDisponivel = larguraJanela - paddingLateral * 2;
  const larguraCardGrid = Math.floor((larguraDisponivel - espacoEntreCards * 2) / 3);

  return (
    <SafeAreaView style={[estilosStockMove.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={estilosStockMove.rolagem}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={() => {
              setRecarregando(true);
              carregarEstoqueEPrateleiras(true);
            }}
            tintColor={corAzulPrincipal}
          />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
            onPress={() => roteador.back()}
            style={estilosStockMove.botaoVoltar}
          >
            <Feather name="arrow-left" size={22} color={corAzulPrincipal} />
            <Text style={[estilosStockMove.textoBotaoVoltar, { color: corAzulPrincipal, fontSize: 15 * fontScale }]}>
              Voltar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Gerenciar prateleiras e locais de armazenamento na AWS"
            onPress={() => roteador.push('/settings-storage' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: corAzulFundo,
              borderColor: corAzulBorda,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
              gap: 6,
            }}
          >
            <Feather name="layers" size={14} color={corAzulPrincipal} />
            <Text style={{ color: corAzulPrincipal, fontWeight: '700', fontSize: 11.5 * fontScale }}>
              Prateleiras AWS ({prateleirasAws.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={estilosStockMove.cabecalho}>
          <Text
            style={[
              estilosStockMove.titulo,
              { color: corAzulPrincipal, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Movimentação Interna
          </Text>
          <Text
            style={[
              estilosStockMove.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            Transfira pacotes entre os armários e geladeiras homologados no banco de dados da AWS.
          </Text>
        </View>

        {discrepanciasDetectadas > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: corAzulFundo,
              borderColor: corAzulBorda,
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
              marginBottom: 12,
              gap: 8,
            }}
          >
            <Feather name="check-circle" size={16} color={corAzulPrincipal} />
            <Text style={{ flex: 1, color: '#1E40AF', fontSize: 11 * fontScale, fontWeight: '600' }}>
              Prateleiras sincronizadas com a AWS: {discrepanciasDetectadas} registro(s) com nomenclatura abreviada foram normalizados.
            </Text>
          </View>
        )}

        {/* Filtro Rápido por Prateleira AWS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        >
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            onPress={() => setFiltroPrateleira('TODAS')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1,
              backgroundColor: filtroPrateleira === 'TODAS' ? corAzulPrincipal : theme.surface,
              borderColor: filtroPrateleira === 'TODAS' ? corAzulPrincipal : theme.border,
            }}
          >
            <Text
              style={{
                color: filtroPrateleira === 'TODAS' ? '#FFFFFF' : theme.text,
                fontSize: 11 * fontScale,
                fontWeight: '700',
              }}
            >
              Todas as Prateleiras ({lotesRaw.length})
            </Text>
          </TouchableOpacity>

          {prateleirasAws.map((prat) => {
            const ativo = mesmaPrateleira(filtroPrateleira, prat.local_descricao);
            return (
              <TouchableOpacity
                key={prat.id_local_armazenamento}
                accessible={true}
                accessibilityRole="button"
                onPress={() => setFiltroPrateleira(ativo ? 'TODAS' : prat.local_descricao)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: ativo ? corAzulPrincipal : theme.surface,
                  borderColor: ativo ? corAzulPrincipal : theme.border,
                }}
              >
                <Feather
                  name={prat.tipo_local === 'geladeira' ? 'thermometer' : 'archive'}
                  size={12}
                  color={ativo ? '#FFFFFF' : corAzulPrincipal}
                />
                <Text
                  style={{
                    color: ativo ? '#FFFFFF' : theme.text,
                    fontSize: 11 * fontScale,
                    fontWeight: ativo ? '700' : '600',
                  }}
                >
                  {prat.local_descricao} ({prat.quantidade_lotes_ativos || 0})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={estilosStockMove.searchBarRow}>
          <View
            style={[
              estilosStockMove.inputSearchWrapper,
              { backgroundColor: theme.surface, borderColor: corAzulBorda },
            ]}
          >
            <Feather name="search" size={16} color={corAzulPrincipal} />
            <TextInput
              placeholder="Buscar produto, lote ou prateleira..."
              placeholderTextColor="#94A3B8"
              value={pesquisa}
              onChangeText={setPesquisa}
              style={[estilosStockMove.searchInput, { color: theme.text, fontSize: 12.5 * fontScale }]}
            />
            {pesquisa.length > 0 && (
              <TouchableOpacity onPress={() => setPesquisa('')}>
                <Feather name="x-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Ler código de barras para movimentar lote"
            onPress={abrirLeitorCodigoBarras}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: corAzulPrincipal,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 6,
            }}
          >
            <Feather name="camera" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={estilosStockMove.toggleGroup}>
            <TouchableOpacity
              onPress={() => setModoExibicao('lista')}
              style={[estilosStockMove.toggleBtn, modoExibicao === 'lista' && estilosStockMove.toggleBtnActive]}
            >
              <Feather name="list" size={16} color={modoExibicao === 'lista' ? corAzulPrincipal : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModoExibicao('grid')}
              style={[estilosStockMove.toggleBtn, modoExibicao === 'grid' && estilosStockMove.toggleBtnActive]}
            >
              <Feather name="grid" size={16} color={modoExibicao === 'grid' ? corAzulPrincipal : '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={corAzulPrincipal} style={{ marginTop: 20 }} />
        ) : produtosFiltrados.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 24,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Feather name="inbox" size={28} color="#94A3B8" />
            <Text style={{ color: theme.text, fontWeight: '700', marginTop: 8, fontSize: 13.5 * fontScale }}>
              Nenhum produto disponível nesta prateleira
            </Text>
            <Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 4, fontSize: 11.5 * fontScale }}>
              Altere o filtro de prateleira acima ou cadastre um novo lote em Entrada de Alimentos.
            </Text>
          </View>
        ) : modoExibicao === 'lista' ? (
          <View style={{ gap: 8 }}>
            {produtosFiltrados.map((item) => {
              const prateleirasDoProduto = Array.from(
                new Set(item.lotes.map((l) => l.local_descricao))
              ).join(' • ');

              return (
                <TouchableOpacity
                  key={item.codigo_barra_produto}
                  onPress={() => {
                    setProdutoSelecionado(item);
                    setModalLotesVisivel(true);
                  }}
                  activeOpacity={0.8}
                  style={[estilosStockMove.listaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Image
                    source={item.foto_url ? { uri: item.foto_url } : obterPlaceholderPorCategoria(item.categoria)}
                    style={estilosStockMove.listaFoto}
                    resizeMode="cover"
                  />

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text
                      style={[estilosStockMove.produtoNome, { color: theme.text, fontSize: 13 * fontScale }]}
                      numberOfLines={1}
                    >
                      {item.nome_produto}
                    </Text>
                    <Text
                      style={[estilosStockMove.produtoMeta, { color: theme.subtext, fontSize: 10.5 * fontScale }]}
                      numberOfLines={1}
                    >
                      {prateleirasDoProduto}
                    </Text>
                    <Text style={[estilosStockMove.produtoSub, { color: corAzulPrincipal, fontSize: 10 * fontScale }]}>
                      Toque para mover ({item.lotes.length} {item.lotes.length === 1 ? 'lote' : 'lotes'})
                    </Text>
                  </View>

                  <View
                    style={[
                      estilosStockMove.badgeQtdConsolidada,
                      { borderColor: corAzulBorda, backgroundColor: corAzulFundo },
                    ]}
                  >
                    <Text
                      style={[
                        estilosStockMove.badgeQtdNumero,
                        { color: corAzulPrincipal, fontSize: 12.5 * fontScale },
                      ]}
                    >
                      {item.quantidade_total}
                    </Text>
                    <Text
                      style={[
                        estilosStockMove.badgeQtdRotulo,
                        { color: corAzulPrincipal, fontSize: 8.5 * fontScale },
                      ]}
                    >
                      pcts
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={estilosStockMove.gridContainer}>
            {produtosFiltrados.map((item) => (
              <TouchableOpacity
                key={item.codigo_barra_produto}
                onPress={() => {
                  setProdutoSelecionado(item);
                  setModalLotesVisivel(true);
                }}
                activeOpacity={0.8}
                style={[
                  estilosStockMove.gridCard,
                  { width: larguraCardGrid, backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Image
                  source={item.foto_url ? { uri: item.foto_url } : obterPlaceholderPorCategoria(item.categoria)}
                  style={estilosStockMove.gridFoto}
                  resizeMode="cover"
                />

                <View style={estilosStockMove.gridConteudo}>
                  <View style={estilosStockMove.gridBadgeRow}>
                    <View style={[estilosStockMove.gridQtdBadge, { backgroundColor: corAzulFundo }]}>
                      <Text style={[estilosStockMove.gridQtdText, { color: corAzulPrincipal, fontSize: 9 * fontScale }]}>
                        {item.quantidade_total}p
                      </Text>
                    </View>
                    <Text style={[estilosStockMove.gridLotesText, { color: theme.subtext, fontSize: 8.5 * fontScale }]}>
                      {item.lotes.length} lotes
                    </Text>
                  </View>
                  <Text
                    style={[estilosStockMove.gridTitulo, { color: theme.text, fontSize: 10.5 * fontScale }]}
                    numberOfLines={2}
                  >
                    {item.nome_produto}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL DA CÂMERA PARA LEITURA DE CÓDIGO DE BARRAS */}
      <Modal
        visible={scannerAberto}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setScannerAberto(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 20, overflow: 'hidden' }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                backgroundColor: corAzulPrincipal,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 * fontScale }}>
                Localizar Produto para Mover
              </Text>
              <TouchableOpacity onPress={() => setScannerAberto(false)}>
                <Feather name="x" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={{ height: 280, backgroundColor: '#000' }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                }}
                onBarcodeScanned={aoLerCodigoCamera}
              />
            </View>
            <View style={{ padding: 16 }}>
              <AppButton title="Cancelar Leitura" variant="outline" onPress={() => setScannerAberto(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 1: ESCOLHER QUAL LOTE MOVER */}
      <Modal
        visible={modalLotesVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLotesVisivel(false)}
      >
        <View style={estilosStockMove.modalOverlay}>
          <View style={estilosStockMove.modalCard}>
            <View style={estilosStockMove.modalCapaContainer}>
              <TouchableOpacity
                onPress={() => setModalLotesVisivel(false)}
                style={estilosStockMove.modalCloseBtnAbsolute}
                accessibilityLabel="Fechar"
              >
                <Feather name="x" size={18} color="#000000" />
              </TouchableOpacity>

              <Image
                source={
                  produtoSelecionado?.foto_url
                    ? { uri: produtoSelecionado.foto_url }
                    : obterPlaceholderPorCategoria(produtoSelecionado?.categoria || '')
                }
                style={estilosStockMove.modalProdutoFotoCapa}
                resizeMode="cover"
              />
            </View>

            <View style={estilosStockMove.modalConteudoBox}>
              <Text
                style={[estilosStockMove.modalProdutoNomeCenter, { color: corAzulPrincipal, fontSize: 17 * fontScale }]}
                numberOfLines={2}
              >
                {produtoSelecionado?.nome_produto}
              </Text>
              <Text style={[estilosStockMove.modalProdutoMetaCenter, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                {produtoSelecionado?.categoria} • EAN: {produtoSelecionado?.codigo_barra_produto}
              </Text>

              <View
                style={[
                  estilosStockMove.modalResumoBox,
                  { backgroundColor: corAzulFundo, borderColor: corAzulBorda },
                ]}
              >
                <Text style={[estilosStockMove.modalResumoTexto, { color: corAzulPrincipal, fontSize: 12.5 * fontScale }]}>
                  Toque no lote que você deseja transferir de prateleira:
                </Text>
              </View>

              <ScrollView style={{ maxHeight: 230 }} showsVerticalScrollIndicator={false}>
                {produtoSelecionado?.lotes.map((lote) => {
                  const statusLote = avaliarStatusLote(lote.data_validade_lote);
                  const isVencido = statusLote === 'vencido';
                  const isProximo = statusLote === 'proximo_vencimento';

                  return (
                    <TouchableOpacity
                      key={lote.id_lote_produto}
                      onPress={() => iniciarFluxoMover(lote)}
                      style={[
                        estilosStockMove.loteCardItem,
                        {
                          borderColor: isVencido ? '#EF4444' : isProximo ? '#FCD34D' : corAzulBorda,
                          backgroundColor: isVencido ? '#FEE2E2' : isProximo ? '#FEFDF8' : '#F8FAFC',
                        },
                      ]}
                    >
                      <View style={estilosStockMove.loteLinhaTopo}>
                        <Text style={[estilosStockMove.loteCodigo, { color: theme.text, fontSize: 12 * fontScale }]}>
                          Lote: {lote.numero_codigo_lote}
                        </Text>
                        <Text
                          style={[estilosStockMove.loteQtd, { color: corAzulPrincipal, fontSize: 12 * fontScale }]}
                        >
                          {lote.quantidade_atual_pacote} pct(s)
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Feather name="map-pin" size={12} color={corAzulPrincipal} style={{ marginRight: 4 }} />
                        <Text
                          style={[
                            estilosStockMove.loteLocal,
                            { color: theme.text, fontWeight: '700', fontSize: 11.5 * fontScale, marginTop: 0 },
                          ]}
                        >
                          Prateleira Atual: {lote.local_descricao}
                        </Text>
                      </View>

                      <Text
                        style={[
                          estilosStockMove.loteValidade,
                          {
                            color: isVencido ? '#DC2626' : isProximo ? '#D97706' : '#16A34A',
                            fontSize: 10.5 * fontScale,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        Validade: {lote.data_validade_lote}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: FORMULÁRIO DE TRANSFERÊNCIA ENTRE PRATELEIRAS AWS */}
      <Modal
        visible={modalMoverVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalMoverVisivel(false)}
      >
        <View style={estilosStockMove.modalOverlay}>
          <View style={[estilosStockMove.modalCard, { borderColor: corAzulPrincipal, borderWidth: 2 }]}>
            <View style={[estilosStockMove.modalConteudoBox, { paddingTop: 20 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontWeight: '800', fontSize: 16 * fontScale, color: corAzulPrincipal }}>
                  Transferir de Prateleira (AWS)
                </Text>
                <TouchableOpacity onPress={() => setModalMoverVisivel(false)}>
                  <Feather name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                <View
                  style={{
                    backgroundColor: corAzulFundo,
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: corAzulBorda,
                  }}
                >
                  <Text style={{ fontWeight: '800', color: theme.text, fontSize: 13 * fontScale }}>
                    {loteSelecionado?.nome_produto} (Lote: {loteSelecionado?.numero_codigo_lote})
                  </Text>
                  <Text style={{ color: '#1E40AF', fontSize: 12 * fontScale, marginTop: 4 }}>
                    Prateleira de Origem:{' '}
                    <Text style={{ fontWeight: '800' }}>{loteSelecionado?.local_descricao}</Text>
                  </Text>
                  <Text style={{ color: '#1E40AF', fontSize: 11.5 * fontScale, marginTop: 2 }}>
                    Saldo disponível neste lote:{' '}
                    <Text style={{ fontWeight: '800' }}>{loteSelecionado?.quantidade_atual_pacote} pacotes</Text>
                  </Text>
                </View>

                <AppInput
                  rotulo={`Quantidade a transferir (Máx: ${loteSelecionado?.quantidade_atual_pacote}) *`}
                  placeholder="Ex: 5"
                  keyboardType="numeric"
                  value={quantidadeMover}
                  onChangeText={(val) => {
                    setQuantidadeMover(val);
                    if (erroFormularioMover) setErroFormularioMover(null);
                  }}
                />

                {vaiDividirLote && (
                  <View
                    style={[
                      estilosStockMove.avisoDivisaoLote,
                      { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                    ]}
                  >
                    <Feather name="git-branch" size={18} color="#B45309" />
                    <Text style={[estilosStockMove.textoAvisoDivisao, { color: '#B45309' }]}>
                      Atenção: Este lote será dividido em 2 locais físicos.{' '}
                      {(loteSelecionado?.quantidade_atual_pacote || 0) - qtdNumerica} pacote(s) permanecerão em{' '}
                      "{loteSelecionado?.local_descricao}" e {qtdNumerica} pacote(s) irão para o novo destino.
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontWeight: '700', color: theme.text, fontSize: 13 * fontScale }}>
                    Prateleira de Destino (AWS) *
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setModalMoverVisivel(false);
                      roteador.push('/settings-storage' as any);
                    }}
                  >
                    <Text style={{ color: corAzulPrincipal, fontWeight: '700', fontSize: 11.5 * fontScale }}>
                      + Nova Prateleira
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={estilosStockMove.gradeOpcoes}>
                  {prateleirasAws.map((loc) => {
                    const selecionado = mesmaPrateleira(
                      prateleiraDestino?.local_descricao,
                      loc.local_descricao
                    );
                    const isLocalAtual = mesmaPrateleira(
                      loc.local_descricao,
                      loteSelecionado?.local_descricao
                    );

                    return (
                      <TouchableOpacity
                        key={loc.id_local_armazenamento}
                        disabled={isLocalAtual}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selecionado, disabled: isLocalAtual }}
                        onPress={() => {
                          setPrateleiraDestino(loc);
                          if (erroFormularioMover) setErroFormularioMover(null);
                        }}
                        style={[
                          estilosStockMove.chipOpcao,
                          {
                            backgroundColor: isLocalAtual
                              ? '#F1F5F9'
                              : selecionado
                              ? corAzulPrincipal
                              : theme.background,
                            borderColor: isLocalAtual
                              ? '#E2E8F0'
                              : selecionado
                              ? corAzulPrincipal
                              : theme.border,
                            opacity: isLocalAtual ? 0.65 : 1,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              flexShrink: 1,
                              paddingRight: 8,
                            }}
                          >
                            <Feather
                              name={loc.tipo_local === 'geladeira' ? 'thermometer' : 'archive'}
                              size={14}
                              color={isLocalAtual ? '#94A3B8' : selecionado ? '#FFFFFF' : corAzulPrincipal}
                            />
                            <Text
                              style={[
                                estilosStockMove.textoChip,
                                {
                                  color: isLocalAtual
                                    ? '#94A3B8'
                                    : selecionado
                                    ? '#FFFFFF'
                                    : theme.text,
                                  fontSize: 12 * fontScale,
                                  textAlign: 'left',
                                },
                              ]}
                            >
                              {loc.local_descricao} {isLocalAtual ? '(Origem Atual)' : ''}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 10.5 * fontScale,
                              fontWeight: '700',
                              color: isLocalAtual ? '#94A3B8' : selecionado ? '#E0E7FF' : theme.subtext,
                            }}
                          >
                            {loc.quantidade_pacotes_alocados || 0} pcts
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {erroFormularioMover && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FEF2F2',
                      borderColor: '#FECACA',
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 4,
                      gap: 8,
                    }}
                  >
                    <Feather name="alert-circle" size={16} color="#DC2626" />
                    <Text style={{ flex: 1, color: '#991B1B', fontSize: 11.5 * fontScale, fontWeight: '600' }}>
                      {erroFormularioMover}
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: 16 }}>
                  {processandoMovimentacao ? (
                    <ActivityIndicator size="large" color={corAzulPrincipal} />
                  ) : (
                    <AppButton
                      title={vaiDividirLote ? 'Transferir e Dividir Lote' : 'Confirmar Transferência na AWS'}
                      variant="primary"
                      onPress={validarEIniciarTransferencia}
                      style={{ backgroundColor: corAzulPrincipal }}
                    />
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CONFIRMAÇÃO DE DIVISÃO DE LOTE */}
      <Modal
        visible={modalPerguntaDivisao}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setModalPerguntaDivisao(false);
          setModalMoverVisivel(true);
        }}
      >
        <View style={[estilosStockMove.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View
            style={[
              estilosStockMove.modalCard,
              { padding: 20, borderColor: '#F59E0B', borderWidth: 2, maxWidth: 350 },
            ]}
          >
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#FEF3C7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Feather name="git-branch" size={26} color="#D97706" />
              </View>
              <Text style={{ fontWeight: '900', fontSize: 16 * fontScale, color: '#B45309', textAlign: 'center' }}>
                Divisão de Lote Detectada!
              </Text>
            </View>

            <Text
              style={{
                color: theme.text,
                fontSize: 12.5 * fontScale,
                textAlign: 'center',
                marginBottom: 16,
                lineHeight: 18,
              }}
            >
              Você está movendo apenas uma parte do lote ({qtdNumerica} de {loteSelecionado?.quantidade_atual_pacote}{' '}
              pacotes).{'\n\n'}
              Isso criará um novo registro de lote rastreável em{' '}
              <Text style={{ fontWeight: 'bold' }}>{prateleiraDestino?.local_descricao}</Text> e manterá os{' '}
              {(loteSelecionado?.quantidade_atual_pacote || 0) - qtdNumerica} pacote(s) restantes em{' '}
              <Text style={{ fontWeight: 'bold' }}>{loteSelecionado?.local_descricao}</Text>. Confirma?
            </Text>

            <View style={{ gap: 8 }}>
              <AppButton
                title="Sim, Dividir e Mover"
                variant="primary"
                onPress={() => {
                  if (prateleiraDestino) {
                    dispararRequisicaoApi(qtdNumerica, prateleiraDestino);
                  }
                }}
                style={{ backgroundColor: '#D97706' }}
              />
              <AppButton
                title="Voltar e Ajustar"
                variant="outline"
                onPress={() => {
                  setModalPerguntaDivisao(false);
                  setModalMoverVisivel(true);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: RESUMO DETALHADO DA MOVIMENTAÇÃO CONCLUÍDA */}
      <Modal
        visible={modalSucessoVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={finalizarFluxo}
      >
        <View style={[estilosStockMove.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
          <View
            style={[
              estilosStockMove.modalCard,
              { padding: 20, borderColor: '#16A34A', borderWidth: 2, maxWidth: 360 },
            ]}
          >
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: '#DCFCE7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Feather name="check-circle" size={30} color="#16A34A" />
              </View>
              <Text style={{ fontWeight: '900', fontSize: 17 * fontScale, color: '#15803D', textAlign: 'center' }}>
                Movimentação Concluída!
              </Text>
              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 11.5 * fontScale,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {resumoMovimentacao?.produto}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginBottom: 16,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Feather name="arrow-up-right" size={16} color="#DC2626" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11 * fontScale, color: '#64748B', fontWeight: 'bold' }}>
                    ↓ Saiu de ({resumoMovimentacao?.localOrigem}):
                  </Text>
                  <Text style={{ fontSize: 12 * fontScale, color: '#DC2626', fontWeight: '800' }}>
                    -{resumoMovimentacao?.qtdMovida} pacote(s) (Lote: {resumoMovimentacao?.loteOriginal})
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Feather name="arrow-down-left" size={16} color="#16A34A" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11 * fontScale, color: '#64748B', fontWeight: 'bold' }}>
                    ↑ Entrou em ({resumoMovimentacao?.localDestino}):
                  </Text>
                  <Text style={{ fontSize: 12 * fontScale, color: '#16A34A', fontWeight: '800' }}>
                    +{resumoMovimentacao?.qtdMovida} pacote(s) (Novo Lote: {resumoMovimentacao?.novoLote})
                  </Text>
                </View>
              </View>

              {resumoMovimentacao && resumoMovimentacao.qtdRestante > 0 && (
                <>
                  <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Feather name="package" size={16} color="#D97706" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11 * fontScale, color: '#64748B', fontWeight: 'bold' }}>
                        Restou em ({resumoMovimentacao.localOrigem}):
                      </Text>
                      <Text style={{ fontSize: 12 * fontScale, color: '#D97706', fontWeight: '800' }}>
                        {resumoMovimentacao.qtdRestante} pacote(s) permanecem no local original.
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <AppButton
              title="Concluir e Atualizar Estoque"
              variant="primary"
              onPress={finalizarFluxo}
              style={{ backgroundColor: '#16A34A' }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 5: AVISO DE ERRO OU VALIDAÇÃO */}
      <Modal
        visible={modalAvisoGenerico.visivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalAvisoGenerico({ ...modalAvisoGenerico, visivel: false })}
      >
        <View style={[estilosStockMove.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View
            style={[
              estilosStockMove.modalCard,
              { padding: 20, borderColor: '#EF4444', borderWidth: 2, maxWidth: 340 },
            ]}
          >
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Feather name="alert-circle" size={32} color="#EF4444" style={{ marginBottom: 6 }} />
              <Text style={{ fontWeight: '800', fontSize: 15 * fontScale, color: '#B91C1C', textAlign: 'center' }}>
                {modalAvisoGenerico.titulo}
              </Text>
            </View>
            <Text
              style={{
                color: theme.text,
                fontSize: 12.5 * fontScale,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {modalAvisoGenerico.mensagem}
            </Text>
            <AppButton
              title="Entendi"
              variant="primary"
              onPress={() => setModalAvisoGenerico({ ...modalAvisoGenerico, visivel: false })}
              style={{ backgroundColor: '#EF4444' }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
