// src/app/home.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { requisicaoApi } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import { estilosHome } from '../styles/home.styles';

interface LoteItem {
  id_lote_produto: string;
  id_produto: string;
  nome_produto: string;
  categoria: string;
  codigo_barra_produto: string;
  numero_codigo_lote: string;
  quantidade_atual_pacote: number;
  estoque_minimo_pacote?: number;
  data_validade_lote: string;
  data_entrada_lote?: string;
  local_descricao: string;
  foto_url?: string;
  url_foto_produto?: string;
}

type NivelCriticidade = 'vencido' | 'proximo_vencimento' | 'abaixo_minimo' | 'regular';

interface ProdutoAgrupado {
  codigo_barra_produto: string;
  nome_produto: string;
  categoria: string;
  quantidade_total: number;
  estoque_minimo: number;
  foto_url?: string;
  loteMaisProximo: string;
  dataEntradaRecente: string;
  criticidade: NivelCriticidade;
  lotes: LoteItem[];
}

type CriterioOrdenacao = 'ALFABETICA' | 'QUANTIDADE' | 'VALIDADE' | 'DATA_ENTRADA' | 'PRIORIDADE_SAIDA';

const avaliarStatusLote = (dataLoteStr: string): 'vencido' | 'proximo_vencimento' | 'regular' => {
  if (!dataLoteStr) return 'regular';
  
  let dataVal;
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

export default function HomeScreen() {
  const router = useRouter();
  const rotaAtual = usePathname();
  const { theme, fontScale } = useAppTheme();
  const { width: larguraJanela } = useWindowDimensions();

  const [usuarioNome, setUsuarioNome] = useState('Colaborador');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [erroCarregarFoto, setErroCarregarFoto] = useState(false);

  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [totalPacotesGeral, setTotalPacotesGeral] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [modoExibicao, setModoExibicao] = useState<'lista' | 'grid'>('lista');

  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<CriterioOrdenacao>('PRIORIDADE_SAIDA');
  const [direcaoAscendente, setDirecaoAscendente] = useState<boolean>(true);

  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);
  const [modalLotesVisivel, setModalLotesVisivel] = useState(false);
  const [menuHamburguerAberto, setMenuHamburguerAberto] = useState(false);

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

  const carregarEstoque = useCallback(async () => {
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        // FILTRO CRÍTICO: Exibe apenas lotes que possuem saldo > 0.
        const lotesProcessados = resposta.lotes.filter((l: any) => Number(l.quantidade_atual_pacote) > 0);
        setLotes(lotesProcessados);
        
        // Recalcular o total de pacotes com base apenas nos lotes processados
        const total = lotesProcessados.reduce((acc: number, curr: any) => acc + Number(curr.quantidade_atual_pacote), 0);
        setTotalPacotesGeral(total);
      } else {
        setLotes([]);
        setTotalPacotesGeral(0);
      }
    } catch (erro) {
      console.warn('[HOME] Erro ao carregar estoque:', erro);
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    const desinscrever = auth.onAuthStateChanged((user) => {
      if (user) {
        setUsuarioNome(user.displayName || user.email?.split('@')[0] || 'Colaborador');
        if (user.photoURL) {
          setFotoPerfil(user.photoURL);
          setErroCarregarFoto(false);
        }
      }
    });

    carregarEstoque();
    return () => desinscrever();
  }, [carregarEstoque]);

  const produtosAgrupados = useMemo(() => {
    const mapa = new Map<string, ProdutoAgrupado>();

    lotes.forEach((lote) => {
      const ean = lote.codigo_barra_produto || lote.id_produto;
      const statusLote = avaliarStatusLote(lote.data_validade_lote);
      const dataVal = lote.data_validade_lote || '9999-12-31';
      const dataEnt = lote.data_entrada_lote || '2000-01-01';
      const estoqueMin = lote.estoque_minimo_pacote || 10;
      const urlFoto = lote.foto_url || lote.url_foto_produto;

      if (!mapa.has(ean)) {
        mapa.set(ean, {
          codigo_barra_produto: ean,
          nome_produto: lote.nome_produto,
          categoria: lote.categoria,
          quantidade_total: lote.quantidade_atual_pacote || 0,
          estoque_minimo: estoqueMin,
          foto_url: urlFoto,
          loteMaisProximo: dataVal,
          dataEntradaRecente: dataEnt,
          criticidade: statusLote === 'vencido' ? 'vencido' : statusLote === 'proximo_vencimento' ? 'proximo_vencimento' : 'regular',
          lotes: [lote],
        });
      } else {
        const existente = mapa.get(ean)!;
        existente.quantidade_total += lote.quantidade_atual_pacote || 0;
        existente.lotes.push(lote);

        if (dataVal < existente.loteMaisProximo) existente.loteMaisProximo = dataVal;
        if (dataEnt > existente.dataEntradaRecente) existente.dataEntradaRecente = dataEnt;

        if (statusLote === 'vencido') {
          existente.criticidade = 'vencido';
        } else if (statusLote === 'proximo_vencimento' && existente.criticidade !== 'vencido') {
          existente.criticidade = 'proximo_vencimento';
        }
      }
    });

    mapa.forEach((prod) => {
      if (prod.criticidade === 'regular' && prod.quantidade_total < prod.estoque_minimo) {
        prod.criticidade = 'abaixo_minimo';
      }
    });

    return Array.from(mapa.values());
  }, [lotes]);

  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set<string>();
    produtosAgrupados.forEach((p) => {
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats);
  }, [produtosAgrupados]);

  const alternarCategoria = (cat: string) => {
    setCategoriasSelecionadas((anteriores) => {
      if (anteriores.includes(cat)) {
        return anteriores.filter((c) => c !== cat);
      }
      return [...anteriores, cat];
    });
  };

  const alternarCriterio = (criterio: CriterioOrdenacao) => {
    if (criterioOrdenacao === criterio) {
      setDirecaoAscendente((anterior) => !anterior);
    } else {
      setCriterioOrdenacao(criterio);
      setDirecaoAscendente(true);
    }
  };

  const itensFiltrados = useMemo(() => {
    let lista = [...produtosAgrupados];
    const termo = termoBusca.toLowerCase().trim();

    if (termo) {
      lista = lista.filter(
        (p) =>
          p.nome_produto.toLowerCase().includes(termo) ||
          p.codigo_barra_produto.includes(termo) ||
          p.categoria.toLowerCase().includes(termo)
      );
    }

    if (categoriasSelecionadas.length > 0) {
      lista = lista.filter((p) =>
        categoriasSelecionadas.some((c) => c.toLowerCase() === p.categoria.toLowerCase())
      );
    }

    lista.sort((a, b) => {
      let resultado = 0;
      switch (criterioOrdenacao) {
        case 'ALFABETICA':
          resultado = a.nome_produto.localeCompare(b.nome_produto);
          return direcaoAscendente ? resultado : -resultado;
        case 'QUANTIDADE':
          resultado = a.quantidade_total - b.quantidade_total;
          return direcaoAscendente ? -resultado : resultado; 
        case 'VALIDADE':
          resultado = a.loteMaisProximo.localeCompare(b.loteMaisProximo);
          return direcaoAscendente ? resultado : -resultado; 
        case 'DATA_ENTRADA':
          resultado = a.dataEntradaRecente.localeCompare(b.dataEntradaRecente);
          return direcaoAscendente ? -resultado : resultado; 
        case 'PRIORIDADE_SAIDA': {
          const prioridade = (c: NivelCriticidade) => (c === 'vencido' ? 3 : c === 'proximo_vencimento' ? 2 : c === 'abaixo_minimo' ? 1 : 0);
          resultado = prioridade(b.criticidade) - prioridade(a.criticidade);
          return direcaoAscendente ? resultado : -resultado;
        }
        default:
          return 0;
      }
    });

    return lista;
  }, [
    produtosAgrupados,
    termoBusca,
    categoriasSelecionadas,
    criterioOrdenacao,
    direcaoAscendente,
  ]);

  const totalVencidos = useMemo(() => produtosAgrupados.filter(p => p.criticidade === 'vencido').length, [produtosAgrupados]);
  const totalProximos = useMemo(() => produtosAgrupados.filter(p => p.criticidade === 'proximo_vencimento').length, [produtosAgrupados]);
  const totalItensAtencao = totalVencidos + totalProximos;

  const obterEstiloCriticidade = (criticidade: NivelCriticidade) => {
    switch (criticidade) {
      case 'vencido':
        return { backgroundColor: '#FEE2E2', borderColor: '#EF4444' };
      case 'proximo_vencimento':
        return { backgroundColor: theme.surface, borderColor: '#F59E0B' };
      case 'abaixo_minimo':
        return { backgroundColor: theme.surface, borderColor: '#F97316' };
      default:
        return { backgroundColor: theme.surface, borderColor: theme.border };
    }
  };

  const paddingLateral = 16;
  const espacoEntreCards = 8;
  const larguraDisponivel = larguraJanela - paddingLateral * 2;
  const larguraCardGrid = Math.floor((larguraDisponivel - espacoEntreCards * 2) / 3);

  const renderizarBotaoOrdenacaoFixo = (
    criterio: CriterioOrdenacao,
    titulo: string,
    iconeFeather?: any,
    iconeMCI?: any
  ) => {
    const ativo = criterioOrdenacao === criterio;
    const corFundo = !ativo ? '#F8FAFC' : direcaoAscendente ? '#0284C7' : '#1E3A8A';
    const corBorda = !ativo ? '#CBD5E1' : direcaoAscendente ? '#0284C7' : '#1E3A8A';
    const corTexto = ativo ? '#FFFFFF' : '#475569';

    return (
      <TouchableOpacity
        onPress={() => alternarCriterio(criterio)}
        accessible={true}
        accessibilityRole="button"
        style={[estilosHome.chipOrdenacaoFixo, { backgroundColor: corFundo, borderColor: corBorda }]}
      >
        {iconeMCI ? (
          <MaterialCommunityIcons name={iconeMCI} size={14} color={corTexto} style={{ marginRight: 6 }} />
        ) : (
          <Feather name={iconeFeather} size={13} color={corTexto} style={{ marginRight: 6 }} />
        )}
        <Text numberOfLines={1} style={[estilosHome.chipOrdenacaoTexto, { color: corTexto, fontSize: 11 * fontScale }]}>
          {titulo}
        </Text>
      </TouchableOpacity>
    );
  };

  const widgetsInferiores = [
    { nome: 'Início', icone: 'home', corFundo: '#E0F2FE', corIcone: '#0284C7', rota: '/home' },
    { nome: 'Estoque', icone: 'package', corFundo: '#DCFCE7', corIcone: '#16A34A', rota: '/stock' },
    { nome: 'Dora IA', icone: 'robot-happy-outline', isMCI: true, corFundo: '#FEF3C7', corIcone: '#D97706', rota: '/dora' },
    { nome: 'Avisos', icone: 'bell', corFundo: '#FCE7F3', corIcone: '#DB2777', rota: '/notifications' },
  ];

  const telasSecundarias = [
    { titulo: 'Relatórios e Balanços', rota: '/reports', icone: 'file-text', corFundo: '#E0E7FF', corIcone: '#4338CA' },
    { titulo: 'Histórico e Auditoria', rota: '/audit', icone: 'clock', corFundo: '#F3E8FF', corIcone: '#7E22CE' },
    { titulo: 'Configurações e Armários', rota: '/settings', icone: 'settings', corFundo: '#F1F5F9', corIcone: '#475569' },
    { titulo: 'Diagnóstico do Sistema', rota: '/health', icone: 'activity', corFundo: '#CCFBF1', corIcone: '#0D9488' },
    { titulo: 'Meu Perfil', rota: '/profile', icone: 'user', corFundo: '#FFEDD5', corIcone: '#EA580C' },
  ];

  return (
    <SafeAreaView style={[estilosHome.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={estilosHome.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={() => {
              setRecarregando(true);
              carregarEstoque();
            }}
            tintColor={theme.primary}
          />
        }
      >
        <View style={estilosHome.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[estilosHome.subSaudacao, { color: theme.subtext, fontSize: 11 * fontScale }]}>
              Casa da Criança • Gestão Solidária
            </Text>
            <Text style={[estilosHome.saudacaoPrincipal, { color: theme.primary, fontSize: 16 * fontScale }]} numberOfLines={1}>
              Seja bem-vindo(a), {usuarioNome}!
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/profile')}
            accessible={true}
            accessibilityRole="button"
            style={estilosHome.avatarWrapper}
          >
            {fotoPerfil && !erroCarregarFoto ? (
              <Image
                source={{ uri: fotoPerfil, headers: { 'Referrer-Policy': 'no-referrer' } }}
                style={estilosHome.avatarImage}
                onError={() => setErroCarregarFoto(true)}
              />
            ) : (
              <Feather name="user" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>

        <View style={[estilosHome.totalCard, { backgroundColor: theme.primary }]}>
          <View style={estilosHome.totalTextoContainer}>
            <Text style={[estilosHome.totalCardLabel, { fontSize: 12 * fontScale }]} numberOfLines={1}>
              Total de produtos atualmente no estoque
            </Text>
            <Text style={[estilosHome.totalCardValue, { fontSize: 22 * fontScale }]}>
              {totalPacotesGeral} pacotes
            </Text>
          </View>
          <View style={estilosHome.totalBadge}>
            <Text style={[estilosHome.totalBadgeText, { fontSize: 10.5 * fontScale }]}>
              {produtosAgrupados.length} itens distintos
            </Text>
          </View>
        </View>

        {/* ALERTA FEFO COMPACTO */}
        {totalItensAtencao > 0 && (
          <View style={[
            estilosHome.alertaAcolhedor, 
            { 
              backgroundColor: totalVencidos > 0 ? '#FEF2F2' : '#FFFBEB',
              borderColor: totalVencidos > 0 ? '#EF4444' : '#FDE68A'
            }
          ]}>
            <MaterialCommunityIcons 
              name="heart-outline" 
              size={18} 
              color={totalVencidos > 0 ? '#EF4444' : '#D97706'} 
              style={estilosHome.alertaAcolhedorIcone} 
            />
            <Text 
              style={[estilosHome.alertaAcolhedorTextoLinha, { 
                color: totalVencidos > 0 ? '#991B1B' : '#92400E', 
                fontSize: 11 * fontScale 
              }]}
              numberOfLines={1}
            >
              {totalVencidos > 0 
                ? `Temos ${totalVencidos} item(ns) que passaram do prazo.` 
                : `Dica: ${totalProximos} produto(s) vencem em breve.`}
            </Text>
          </View>
        )}

        <View style={estilosHome.searchSection}>
          <View style={estilosHome.searchHeaderRow}>
            <Text style={[estilosHome.sectionTitle, { color: theme.text, fontSize: 14 * fontScale }]}>
              Itens no Estoque ({itensFiltrados.length})
            </Text>

            <View style={estilosHome.toggleGroup}>
              <TouchableOpacity
                onPress={() => setModoExibicao('lista')}
                accessible={true}
                accessibilityRole="button"
                style={[estilosHome.toggleBtn, modoExibicao === 'lista' && estilosHome.toggleBtnActive]}
              >
                <Feather name="list" size={16} color={modoExibicao === 'lista' ? theme.primary : '#64748B'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModoExibicao('grid')}
                accessible={true}
                accessibilityRole="button"
                style={[estilosHome.toggleBtn, modoExibicao === 'grid' && estilosHome.toggleBtnActive]}
              >
                <Feather name="grid" size={16} color={modoExibicao === 'grid' ? theme.primary : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={estilosHome.searchBarRow}>
            <View style={[estilosHome.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Buscar por nome ou código..."
                placeholderTextColor="#94A3B8"
                value={termoBusca}
                onChangeText={setTermoBusca}
                style={[estilosHome.searchInput, { color: theme.text, fontSize: 12.5 * fontScale }]}
              />
              {termoBusca.length > 0 && (
                <TouchableOpacity onPress={() => setTermoBusca('')}>
                  <Feather name="x-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
              accessible={true}
              accessibilityRole="button"
              style={[
                estilosHome.btnBuscaAvancada,
                {
                  backgroundColor: buscaAvancadaAberta ? `${theme.primary}15` : theme.surface,
                  borderColor: buscaAvancadaAberta ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather name="sliders" size={16} color={buscaAvancadaAberta ? theme.primary : '#475569'} />
            </TouchableOpacity>
          </View>

          {buscaAvancadaAberta && (
            <View style={[estilosHome.gavetaFiltros, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={estilosHome.linhaFiltro}>
                <Text style={[estilosHome.labelFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>
                  Categorias de Produtos:
                </Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilosHome.scrollCategoriasContainer}>
                  <TouchableOpacity
                    onPress={() => setCategoriasSelecionadas([])}
                    style={[estilosHome.chipCategoria, categoriasSelecionadas.length === 0 && estilosHome.chipCategoriaAtivo]}
                  >
                    <Text style={[estilosHome.chipCategoriaTexto, categoriasSelecionadas.length === 0 && estilosHome.chipCategoriaTextoAtivo, { fontSize: 11 * fontScale }]}>
                      Todas as Categorias
                    </Text>
                  </TouchableOpacity>

                  {categoriasDisponiveis.map((cat) => {
                    const selecionado = categoriasSelecionadas.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => alternarCategoria(cat)}
                        style={[estilosHome.chipCategoria, selecionado && estilosHome.chipCategoriaAtivo]}
                      >
                        {selecionado && <Feather name="check" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />}
                        <Text style={[estilosHome.chipCategoriaTexto, selecionado && estilosHome.chipCategoriaTextoAtivo, { fontSize: 11 * fontScale }]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={estilosHome.linhaFiltro}>
                <Text style={[estilosHome.labelFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>
                  Ordenar por (toque para inverter):
                </Text>
                <View style={estilosHome.botoesWrapRow}>
                  {renderizarBotaoOrdenacaoFixo('ALFABETICA', 'Ordem alfabética', undefined, 'sort-alphabetical-variant')}
                  {renderizarBotaoOrdenacaoFixo('QUANTIDADE', 'Qtd. em estoque', 'layers', undefined)}
                  {renderizarBotaoOrdenacaoFixo('VALIDADE', 'Data de validade', 'calendar', undefined)}
                  {renderizarBotaoOrdenacaoFixo('PRIORIDADE_SAIDA', 'Prioridade de saída', 'alert-circle', undefined)}
                </View>
              </View>
            </View>
          )}
        </View>

        {carregando ? (
          <View style={estilosHome.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[estilosHome.loadingText, { color: theme.subtext, fontSize: 12.5 * fontScale }]}>
              Atualizando os itens do estoque...
            </Text>
          </View>
        ) : modoExibicao === 'lista' ? (
          <View style={{ gap: 8 }}>
            {itensFiltrados.map((item) => {
              const estiloVisual = obterEstiloCriticidade(item.criticidade);

              return (
                <TouchableOpacity
                  key={item.codigo_barra_produto}
                  onPress={() => {
                    setProdutoSelecionado(item);
                    setModalLotesVisivel(true);
                  }}
                  activeOpacity={0.8}
                  style={[estilosHome.listaCard, { backgroundColor: estiloVisual.backgroundColor, borderColor: estiloVisual.borderColor }]}
                >
                  <Image
                    source={item.foto_url ? { uri: item.foto_url } : obterPlaceholderPorCategoria(item.categoria)}
                    style={estilosHome.listaFoto}
                    resizeMode="cover"
                  />

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <View style={estilosHome.tituloComAlertaRow}>
                      <Text style={[estilosHome.produtoNome, { color: theme.text, fontSize: 13 * fontScale }]} numberOfLines={1}>
                        {item.nome_produto}
                      </Text>
                      {item.criticidade === 'abaixo_minimo' && <Feather name="alert-triangle" size={14} color="#D97706" style={{ marginLeft: 4 }} />}
                    </View>
                    <Text style={[estilosHome.produtoMeta, { color: theme.subtext, fontSize: 10.5 * fontScale }]} numberOfLines={1}>
                      {item.categoria} • EAN: {item.codigo_barra_produto}
                    </Text>
                    <Text
                      style={[
                        estilosHome.produtoSub,
                        {
                          color: item.criticidade === 'vencido' ? '#B91C1C' : item.criticidade === 'proximo_vencimento' ? '#DC2626' : item.criticidade === 'abaixo_minimo' ? '#C2410C' : '#0369A1',
                          fontWeight: item.criticidade === 'abaixo_minimo' ? '800' : '600',
                          fontSize: 10 * fontScale,
                        },
                      ]}
                    >
                      {item.criticidade === 'vencido' ? 'Lote(s) com validade expirada' : item.criticidade === 'proximo_vencimento' ? 'Atenção: lote próximo do vencimento' : item.criticidade === 'abaixo_minimo' ? `Estoque baixo: abaixo de ${item.estoque_minimo} pacotes` : `${item.lotes.length} lote(s) registrado(s)`}
                    </Text>
                  </View>

                  <View style={[estilosHome.badgeQtdConsolidada, item.criticidade === 'abaixo_minimo' && { borderColor: '#FDBA74', backgroundColor: '#FFF7ED' }, item.criticidade === 'vencido' && { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}>
                    <Text style={[estilosHome.badgeQtdNumero, { color: item.criticidade === 'vencido' ? '#B91C1C' : item.criticidade === 'abaixo_minimo' ? '#C2410C' : theme.primary, fontSize: 12.5 * fontScale }]}>
                      {item.quantidade_total}
                    </Text>
                    <Text style={[estilosHome.badgeQtdRotulo, { color: item.criticidade === 'vencido' ? '#B91C1C' : item.criticidade === 'abaixo_minimo' ? '#C2410C' : theme.primary, fontSize: 8.5 * fontScale }]}>
                      pcts
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={estilosHome.gridContainer}>
            {itensFiltrados.map((item) => {
              const estiloVisual = obterEstiloCriticidade(item.criticidade);

              return (
                <TouchableOpacity
                  key={item.codigo_barra_produto}
                  onPress={() => {
                    setProdutoSelecionado(item);
                    setModalLotesVisivel(true);
                  }}
                  activeOpacity={0.8}
                  style={[estilosHome.gridCard, { width: larguraCardGrid, backgroundColor: estiloVisual.backgroundColor, borderColor: estiloVisual.borderColor }]}
                >
                  <Image
                    source={item.foto_url ? { uri: item.foto_url } : obterPlaceholderPorCategoria(item.categoria)}
                    style={estilosHome.gridFoto}
                    resizeMode="cover"
                  />

                  <View style={estilosHome.gridConteudo}>
                    <View style={estilosHome.gridBadgeRow}>
                      <View style={[estilosHome.gridQtdBadge, item.criticidade === 'abaixo_minimo' && { backgroundColor: '#FFEDD5' }, item.criticidade === 'vencido' && { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[estilosHome.gridQtdText, { color: item.criticidade === 'vencido' ? '#B91C1C' : item.criticidade === 'abaixo_minimo' ? '#C2410C' : theme.primary, fontSize: 9 * fontScale }]}>
                          {item.quantidade_total}p
                        </Text>
                      </View>
                      <Text style={[estilosHome.gridLotesText, { color: theme.subtext, fontSize: 8.5 * fontScale }]}>
                        {item.lotes.length} lotes
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[estilosHome.gridTitulo, { color: theme.text, fontSize: 10.5 * fontScale, flexShrink: 1 }]} numberOfLines={2}>
                        {item.nome_produto}
                      </Text>
                      {item.criticidade === 'abaixo_minimo' && <Feather name="alert-triangle" size={11} color="#D97706" style={{ marginLeft: 3 }} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!carregando && itensFiltrados.length === 0 && (
          <View style={[estilosHome.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="inbox" size={28} color="#94A3B8" />
            <Text style={[estilosHome.emptyTitle, { color: theme.text, fontSize: 12.5 * fontScale }]}>
              Nenhum produto encontrado
            </Text>
            <Text style={[estilosHome.emptySubtitle, { color: theme.subtext, fontSize: 11 * fontScale }]}>
              Tente redefinir os filtros de busca ou selecionar outras categorias.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 🚀 MODAL DOS LOTES - REFATORADO COM CAPA FULL WIDTH */}
      <Modal
        visible={modalLotesVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLotesVisivel(false)}
      >
        <View style={estilosHome.modalOverlay}>
          <View style={estilosHome.modalCard}>
            
            {/* Capa do Modal (Imagem Gigante) */}
            <View style={estilosHome.modalCapaContainer}>
              <TouchableOpacity
                onPress={() => setModalLotesVisivel(false)}
                style={estilosHome.modalCloseBtnAbsolute}
                accessibilityLabel="Fechar"
              >
                <Feather name="x" size={18} color="#000000" />
              </TouchableOpacity>
              
              <Image
                source={produtoSelecionado?.foto_url ? { uri: produtoSelecionado.foto_url } : obterPlaceholderPorCategoria(produtoSelecionado?.categoria || '')}
                style={estilosHome.modalProdutoFotoCapa}
                resizeMode="cover"
              />
            </View>

            {/* Conteúdo Abaixo da Capa */}
            <View style={estilosHome.modalConteudoBox}>
              <Text style={[estilosHome.modalProdutoNomeCenter, { color: theme.primary, fontSize: 17 * fontScale }]} numberOfLines={2}>
                {produtoSelecionado?.nome_produto}
              </Text>
              <Text style={[estilosHome.modalProdutoMetaCenter, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                {produtoSelecionado?.categoria} • EAN: {produtoSelecionado?.codigo_barra_produto}
              </Text>

              <View style={estilosHome.modalResumoBox}>
                <Text style={[estilosHome.modalResumoTexto, { color: theme.primary, fontSize: 12.5 * fontScale }]}>
                  Estoque atual: <Text style={{ fontWeight: '800' }}>{produtoSelecionado?.quantidade_total} pacotes</Text>
                  {produtoSelecionado && produtoSelecionado.quantidade_total < produtoSelecionado.estoque_minimo && (
                    <Text style={{ color: '#EA580C', fontWeight: '700' }}> (Abaixo do mínimo de {produtoSelecionado.estoque_minimo})</Text>
                  )}
                </Text>
              </View>

              <Text style={[estilosHome.modalLotesTitulo, { color: theme.text, fontSize: 13 * fontScale }]}>
                Nossos Lotes:
              </Text>

              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {produtoSelecionado?.lotes.map((lote) => {
                  const statusLote = avaliarStatusLote(lote.data_validade_lote);
                  const isVencido = statusLote === 'vencido';
                  const isProximo = statusLote === 'proximo_vencimento';

                  return (
                    <View
                      key={lote.id_lote_produto}
                      style={[
                        estilosHome.loteCardItem,
                        {
                          borderColor: isVencido ? '#EF4444' : isProximo ? '#FCD34D' : '#E2E8F0',
                          backgroundColor: isVencido ? '#FEE2E2' : isProximo ? '#FEFDF8' : '#F8FAFC',
                        },
                      ]}
                    >
                      <View style={estilosHome.loteLinhaTopo}>
                        <Text style={[estilosHome.loteCodigo, { color: theme.text, fontSize: 11.5 * fontScale }]}>
                          Lote: {lote.numero_codigo_lote}
                        </Text>
                        <Text style={[estilosHome.loteQtd, { color: isVencido ? '#B91C1C' : theme.primary, fontSize: 11.5 * fontScale }]}>
                          {lote.quantidade_atual_pacote} pacotes
                        </Text>
                      </View>

                      <Text style={[estilosHome.loteLocal, { color: theme.subtext, fontSize: 10.5 * fontScale }]}>
                        Local: {lote.local_descricao}
                      </Text>

                      <Text
                        style={[
                          estilosHome.loteValidade,
                          {
                            color: isVencido ? '#DC2626' : isProximo ? '#D97706' : '#16A34A',
                            fontSize: 10.5 * fontScale,
                            fontWeight: isVencido || isProximo ? '700' : '500',
                          },
                        ]}
                      >
                        Validade: {lote.data_validade_lote} {isVencido ? '(Passou do prazo)' : isProximo ? '(Vence logo)' : '(No prazo)'}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setModalLotesVisivel(false)}
                style={[estilosHome.modalBtnPrimario, { backgroundColor: theme.primary }]}
              >
                <Text style={[estilosHome.modalBtnTexto, { fontSize: 13 * fontScale }]}>Entendi, Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Hambúrguer */}
      <Modal
        visible={menuHamburguerAberto}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuHamburguerAberto(false)}
      >
        <View style={estilosHome.menuOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setMenuHamburguerAberto(false)}
          />
          <View style={[estilosHome.menuSheet, { backgroundColor: theme.surface }]}>
            <View style={estilosHome.menuDragBar} />
            <View style={estilosHome.menuHeader}>
              <Text style={[estilosHome.menuTitulo, { color: theme.text, fontSize: 15 * fontScale }]}>
                Mais opções e ferramentas
              </Text>
              <TouchableOpacity onPress={() => setMenuHamburguerAberto(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8, marginTop: 6 }}>
              {telasSecundarias.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setMenuHamburguerAberto(false);
                    router.push(item.rota as any);
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  style={[estilosHome.menuItemBtn, { borderColor: theme.border }]}
                >
                  <View style={[estilosHome.menuItemIconBox, { backgroundColor: item.corFundo }]}>
                    <Feather name={item.icone as any} size={18} color={item.corIcone} />
                  </View>
                  <Text style={[estilosHome.menuItemTexto, { color: theme.text, fontSize: 13 * fontScale }]}>
                    {item.titulo}
                  </Text>
                  <Feather name="chevron-right" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Barra Inferior com Ícones Pastel e Hambúrguer */}
      <View style={[estilosHome.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        {widgetsInferiores.map((widget, idx) => {
          const ativo = rotaAtual === widget.rota;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(widget.rota as any)}
              accessible={true}
              accessibilityRole="button"
              style={estilosHome.bottomTabItem}
            >
              <View
                style={[
                  estilosHome.tabIconCircle,
                  { backgroundColor: ativo ? theme.primary : widget.corFundo },
                ]}
              >
                {widget.isMCI ? (
                  <MaterialCommunityIcons
                    name="robot-happy-outline"
                    size={19}
                    color={ativo ? '#FFFFFF' : widget.corIcone}
                  />
                ) : (
                  <Feather
                    name={widget.icone as any}
                    size={17}
                    color={ativo ? '#FFFFFF' : widget.corIcone}
                  />
                )}
              </View>
              <Text
                style={[
                  estilosHome.tabRotulo,
                  {
                    color: ativo ? theme.primary : theme.text,
                    fontWeight: ativo ? '700' : '500',
                    fontSize: 9.5 * fontScale,
                  },
                ]}
              >
                {widget.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => setMenuHamburguerAberto(true)}
          accessible={true}
          accessibilityRole="button"
          style={estilosHome.bottomTabItem}
        >
          <View style={[estilosHome.tabIconCircle, { backgroundColor: '#F1F5F9' }]}>
            <Feather name="menu" size={17} color="#334155" />
          </View>
          <Text style={[estilosHome.tabRotulo, { color: theme.text, fontWeight: '500', fontSize: 9.5 * fontScale }]}>
            Mais
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}