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
  status_validade_lote?: string;
  local_descricao: string;
  foto_url?: string;
}

type NivelCriticidade = 'vencido' | 'proximo_vencimento' | 'regular';

interface ProdutoAgrupado {
  codigo_barra_produto: string;
  nome_produto: string;
  categoria: string;
  quantidade_total: number;
  estoque_minimo: number;
  foto_url?: string;
  loteMaisProximo: string;
  dataEntradaRecente: string;
  criticidadeValidade: NivelCriticidade;
  abaixoEstoqueMinimo: boolean;
  lotes: LoteItem[];
}

type CriterioOrdenacao =
  | 'ALFABETICA'
  | 'QUANTIDADE'
  | 'VALIDADE'
  | 'DATA_ENTRADA'
  | 'PRIORIDADE_SAIDA';

const avaliarStatusLote = (lote: LoteItem): NivelCriticidade => {
  const statusApi = (lote.status_validade_lote || '').toLowerCase();
  if (statusApi.includes('vencido') && !statusApi.includes('próximo') && !statusApi.includes('proximo')) {
    return 'vencido';
  }
  if (statusApi.includes('próximo') || statusApi.includes('proximo')) {
    return 'proximo_vencimento';
  }

  if (lote.data_validade_lote && lote.data_validade_lote.includes('-')) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVal = new Date(lote.data_validade_lote);
    if (!isNaN(dataVal.getTime())) {
      const diffDias = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDias < 0) return 'vencido';
      if (diffDias <= 7) return 'proximo_vencimento';
    }
  }

  return 'regular';
};

export default function HomeScreen() {
  const router = useRouter();
  const rotaAtual = usePathname();
  const { theme, fontScale } = useAppTheme();
  const { width: larguraJanela } = useWindowDimensions();

  // Usuário
  const [usuarioNome, setUsuarioNome] = useState('Colaborador');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [erroCarregarFoto, setErroCarregarFoto] = useState(false);

  // Dados do Estoque
  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [totalPacotesGeral, setTotalPacotesGeral] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [modoExibicao, setModoExibicao] = useState<'lista' | 'grid'>('lista');

  // Filtros Avançados
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<CriterioOrdenacao>('ALFABETICA');
  const [direcaoAscendente, setDirecaoAscendente] = useState<boolean>(true);

  // Modais
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);
  const [modalLotesVisivel, setModalLotesVisivel] = useState(false);
  const [menuHamburguerAberto, setMenuHamburguerAberto] = useState(false);

  // Placeholders .jpg
  const obterPlaceholderPorCategoria = (categoria: string) => {
    const cat = (categoria || '').toLowerCase();
    try {
      if (cat.includes('lati') || cat.includes('leite')) {
        return require('../../assets/images/placeholder_laticinios.png');
      }
      if (cat.includes('grão') || cat.includes('arroz') || cat.includes('feij')) {
        return require('../../assets/images/placeholder_graos.png');
      }
      if (cat.includes('massa') || cat.includes('macarr')) {
        return require('../../assets/images/placeholder_massas.png');
      }
      if (cat.includes('óleo') || cat.includes('oleo') || cat.includes('gordura')) {
        return require('../../assets/images/placeholder_oleos.png');
      }
      return require('../../assets/images/placeholder_geral.png');
    } catch {
      return { uri: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=150' };
    }
  };

  const carregarEstoque = useCallback(async () => {
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        setLotes(resposta.lotes);
        setTotalPacotesGeral(resposta.total_pacotes || 0);
      } else {
        setLotes([
          {
            id_lote_produto: 'l1',
            id_produto: 'p1',
            nome_produto: 'Leite Integral UHT 1L',
            categoria: 'Laticínios',
            codigo_barra_produto: '7891000100103',
            numero_codigo_lote: 'L-2026-A1',
            quantidade_atual_pacote: 3,
            estoque_minimo_pacote: 10,
            data_validade_lote: '2026-10-26',
            data_entrada_lote: '2026-10-01',
            status_validade_lote: 'próximo do vencimento',
            local_descricao: 'Geladeira 1 (Prateleira Central)',
          },
          {
            id_lote_produto: 'l2',
            id_produto: 'p1',
            nome_produto: 'Leite Integral UHT 1L',
            categoria: 'Laticínios',
            codigo_barra_produto: '7891000100103',
            numero_codigo_lote: 'L-2026-B4',
            quantidade_atual_pacote: 2,
            estoque_minimo_pacote: 10,
            data_validade_lote: '2026-11-15',
            data_entrada_lote: '2026-10-05',
            status_validade_lote: 'regular',
            local_descricao: 'Armário A (Prateleira 1)',
          },
          {
            id_lote_produto: 'l3',
            id_produto: 'p2',
            nome_produto: 'Arroz Tipo 1 5kg',
            categoria: 'Grãos e Cereais',
            codigo_barra_produto: '7891000200204',
            numero_codigo_lote: 'L-AR-10',
            quantidade_atual_pacote: 40,
            estoque_minimo_pacote: 15,
            data_validade_lote: '2027-05-10',
            data_entrada_lote: '2026-09-15',
            status_validade_lote: 'regular',
            local_descricao: 'Armário B (Palete Inferior)',
          },
          {
            id_lote_produto: 'l4',
            id_produto: 'p3',
            nome_produto: 'Macarrão Espaguete 500g',
            categoria: 'Massas',
            codigo_barra_produto: '7891000400406',
            numero_codigo_lote: 'L-MC-02',
            quantidade_atual_pacote: 25,
            estoque_minimo_pacote: 20,
            data_validade_lote: '2026-10-18',
            data_entrada_lote: '2026-10-10',
            status_validade_lote: 'vencido',
            local_descricao: 'Armário A (Prateleira 3)',
          },
          {
            id_lote_produto: 'l5',
            id_produto: 'p4',
            nome_produto: 'Óleo de Soja 900ml',
            categoria: 'Óleos e Gorduras',
            codigo_barra_produto: '7891000500507',
            numero_codigo_lote: 'L-OL-01',
            quantidade_atual_pacote: 4,
            estoque_minimo_pacote: 12,
            data_validade_lote: '2027-12-20',
            data_entrada_lote: '2026-08-20',
            status_validade_lote: 'regular',
            local_descricao: 'Armário A (Prateleira 2)',
          },
        ]);
        setTotalPacotesGeral(74);
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
      const statusLote = avaliarStatusLote(lote);
      const dataVal = lote.data_validade_lote || '9999-12-31';
      const dataEnt = lote.data_entrada_lote || '2000-01-01';
      const estoqueMin = lote.estoque_minimo_pacote || 10;

      if (!mapa.has(ean)) {
        mapa.set(ean, {
          codigo_barra_produto: ean,
          nome_produto: lote.nome_produto,
          categoria: lote.categoria,
          quantidade_total: lote.quantidade_atual_pacote || 0,
          estoque_minimo: estoqueMin,
          foto_url: lote.foto_url,
          loteMaisProximo: dataVal,
          dataEntradaRecente: dataEnt,
          criticidadeValidade: statusLote,
          abaixoEstoqueMinimo: false,
          lotes: [lote],
        });
      } else {
        const existente = mapa.get(ean)!;
        existente.quantidade_total += lote.quantidade_atual_pacote || 0;
        existente.lotes.push(lote);

        if (dataVal < existente.loteMaisProximo) existente.loteMaisProximo = dataVal;
        if (dataEnt > existente.dataEntradaRecente) existente.dataEntradaRecente = dataEnt;

        if (statusLote === 'vencido') {
          existente.criticidadeValidade = 'vencido';
        } else if (statusLote === 'proximo_vencimento' && existente.criticidadeValidade !== 'vencido') {
          existente.criticidadeValidade = 'proximo_vencimento';
        }
      }
    });

    mapa.forEach((prod) => {
      prod.abaixoEstoqueMinimo = prod.quantidade_total < prod.estoque_minimo;
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
          return direcaoAscendente ? resultado : -resultado;
        case 'VALIDADE':
          resultado = a.loteMaisProximo.localeCompare(b.loteMaisProximo);
          return direcaoAscendente ? resultado : -resultado;
        case 'DATA_ENTRADA':
          resultado = a.dataEntradaRecente.localeCompare(b.dataEntradaRecente);
          return direcaoAscendente ? resultado : -resultado;
        case 'PRIORIDADE_SAIDA': {
          const prioridade = (p: ProdutoAgrupado) =>
            p.criticidadeValidade === 'vencido' ? 3 : p.criticidadeValidade === 'proximo_vencimento' ? 2 : p.abaixoEstoqueMinimo ? 1 : 0;
          resultado = prioridade(b) - prioridade(a);
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

  const totalItensAtencao = useMemo(() => {
    return produtosAgrupados.filter(
      (p) => p.criticidadeValidade === 'proximo_vencimento' || p.criticidadeValidade === 'vencido'
    ).length;
  }, [produtosAgrupados]);

  // Regras de Cores da Identidade Visual:
  // - Vencido: Background em vermelho opaco + borda vermelha
  // - Próximo do vencimento: Borda em Âmbar Alerta Dora (#F59E0B)
  // - Abaixo do estoque mínimo: Card/lista sem cor diferente (usa surface e border padrão)
  const obterEstiloCard = (criticidade: NivelCriticidade) => {
    switch (criticidade) {
      case 'vencido':
        return {
          backgroundColor: '#FEE2E2', // Vermelho opaco
          borderColor: '#EF4444',     // Borda vermelha
        };
      case 'proximo_vencimento':
        return {
          backgroundColor: theme.surface,
          borderColor: '#F59E0B',     // Âmbar Alerta Dora oficial
        };
      default:
        return {
          backgroundColor: theme.surface,
          borderColor: theme.border,  // Borda padrão suave
        };
    }
  };

  const paddingLateral = 16;
  const espacoEntreCards = 8;
  const larguraDisponivel = larguraJanela - paddingLateral * 2;
  const larguraCardGrid = Math.floor((larguraDisponivel - espacoEntreCards * 2) / 3);

  // Paleta Pastel
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
        accessibilityLabel={`${titulo}, ${ativo ? (direcaoAscendente ? 'ordem crescente' : 'ordem decrescente') : 'inativo'}`}
        style={[
          estilosHome.chipOrdenacaoFixo,
          {
            backgroundColor: corFundo,
            borderColor: corBorda,
          },
        ]}
      >
        {iconeMCI ? (
          <MaterialCommunityIcons
            name={iconeMCI}
            size={14}
            color={corTexto}
            style={{ marginRight: 6 }}
          />
        ) : (
          <Feather
            name={iconeFeather}
            size={13}
            color={corTexto}
            style={{ marginRight: 6 }}
          />
        )}
        <Text
          numberOfLines={1}
          style={[
            estilosHome.chipOrdenacaoTexto,
            { color: corTexto, fontSize: 11 * fontScale },
          ]}
        >
          {titulo}
        </Text>
      </TouchableOpacity>
    );
  };

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
        {/* Topo com Saudação e Foto de Perfil */}
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
            accessibilityLabel="Acessar meu perfil"
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

        {/* Card do Total de Produtos no Estoque */}
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

        {/* Alerta de Validade Amigável */}
        {totalItensAtencao > 0 && (
          <View style={estilosHome.alertaAcolhedor}>
            <View style={estilosHome.alertaAcolhedorIcone}>
              <MaterialCommunityIcons name="heart-outline" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[estilosHome.alertaAcolhedorTitulo, { fontSize: 12.5 * fontScale }]}>
                Dica de carinho com os alimentos
              </Text>
              <Text style={[estilosHome.alertaAcolhedorTexto, { fontSize: 11 * fontScale }]}>
                Temos {totalItensAtencao} produto(s) com atenção de validade prioritária. Que tal aproveitá-los nas próximas receitas?
              </Text>
            </View>
          </View>
        )}

        {/* Busca e Filtros */}
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
                accessibilityLabel="Visualizar em lista"
                style={[estilosHome.toggleBtn, modoExibicao === 'lista' && estilosHome.toggleBtnActive]}
              >
                <Feather
                  name="list"
                  size={16}
                  color={modoExibicao === 'lista' ? theme.primary : '#64748B'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModoExibicao('grid')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Visualizar em grade"
                style={[estilosHome.toggleBtn, modoExibicao === 'grid' && estilosHome.toggleBtnActive]}
              >
                <Feather
                  name="grid"
                  size={16}
                  color={modoExibicao === 'grid' ? theme.primary : '#64748B'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={estilosHome.searchBarRow}>
            <View style={[estilosHome.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Buscar por nome ou código de barras..."
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
              accessibilityLabel="Alternar filtros avançados e ordenação"
              style={[
                estilosHome.btnBuscaAvancada,
                {
                  backgroundColor: buscaAvancadaAberta ? `${theme.primary}15` : theme.surface,
                  borderColor: buscaAvancadaAberta ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather
                name="sliders"
                size={16}
                color={buscaAvancadaAberta ? theme.primary : '#475569'}
              />
            </TouchableOpacity>
          </View>

          {/* Gaveta de Filtros */}
          {buscaAvancadaAberta && (
            <View style={[estilosHome.gavetaFiltros, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {/* Categorias com Múltipla Seleção */}
              <View style={estilosHome.blocoFiltro}>
                <View style={estilosHome.headerCategoriasRow}>
                  <Text style={[estilosHome.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>
                    Categorias de Produtos:
                  </Text>
                  {categoriasSelecionadas.length > 0 && (
                    <TouchableOpacity onPress={() => setCategoriasSelecionadas([])}>
                      <Text style={[estilosHome.limparFiltroTexto, { color: theme.primary, fontSize: 11 * fontScale }]}>
                        Limpar seleção ({categoriasSelecionadas.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={estilosHome.scrollCategoriasContainer}
                >
                  <TouchableOpacity
                    onPress={() => setCategoriasSelecionadas([])}
                    style={[
                      estilosHome.chipCategoria,
                      categoriasSelecionadas.length === 0 && estilosHome.chipCategoriaAtivo,
                    ]}
                  >
                    <Text
                      style={[
                        estilosHome.chipCategoriaTexto,
                        categoriasSelecionadas.length === 0 && estilosHome.chipCategoriaTextoAtivo,
                        { fontSize: 11 * fontScale },
                      ]}
                    >
                      Todas as Categorias
                    </Text>
                  </TouchableOpacity>

                  {categoriasDisponiveis.map((cat) => {
                    const selecionado = categoriasSelecionadas.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => alternarCategoria(cat)}
                        accessible={true}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selecionado }}
                        style={[
                          estilosHome.chipCategoria,
                          selecionado && estilosHome.chipCategoriaAtivo,
                        ]}
                      >
                        {selecionado && (
                          <Feather name="check" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        )}
                        <Text
                          style={[
                            estilosHome.chipCategoriaTexto,
                            selecionado && estilosHome.chipCategoriaTextoAtivo,
                            { fontSize: 11 * fontScale },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Botões Fixos de Ordenação */}
              <View style={estilosHome.blocoFiltro}>
                <Text style={[estilosHome.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>
                  Ordenar por:
                </Text>

                <View style={estilosHome.botoesWrapRow}>
                  {renderizarBotaoOrdenacaoFixo('ALFABETICA', 'Ordem alfabética', undefined, 'sort-alphabetical-variant')}
                  {renderizarBotaoOrdenacaoFixo('QUANTIDADE', 'Qtd. em estoque', 'layers', undefined)}
                  {renderizarBotaoOrdenacaoFixo('VALIDADE', 'Data de validade', 'calendar', undefined)}
                  {renderizarBotaoOrdenacaoFixo('DATA_ENTRADA', 'Data de entrada', 'arrow-down-circle', undefined)}
                  {renderizarBotaoOrdenacaoFixo('PRIORIDADE_SAIDA', 'Prioridade de saída', 'alert-circle', undefined)}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Listagem de Produtos com Ícone de Alerta e Regras Visuais Refatoradas */}
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
              const estiloVisual = obterEstiloCard(item.criticidadeValidade);

              return (
                <TouchableOpacity
                  key={item.codigo_barra_produto}
                  onPress={() => {
                    setProdutoSelecionado(item);
                    setModalLotesVisivel(true);
                  }}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nome_produto}, ${item.abaixoEstoqueMinimo ? 'atenção estoque baixo' : ''}, validade: ${item.criticidadeValidade}, total de ${item.quantidade_total} pacotes`}
                  style={[
                    estilosHome.listaCard,
                    {
                      backgroundColor: estiloVisual.backgroundColor,
                      borderColor: estiloVisual.borderColor,
                    },
                  ]}
                >
                  <Image
                    source={
                      item.foto_url
                        ? { uri: item.foto_url }
                        : obterPlaceholderPorCategoria(item.categoria)
                    }
                    style={estilosHome.listaFoto}
                    resizeMode="cover"
                  />

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    {/* Linha do Nome com Ícone de Atenção se estiver abaixo do mínimo */}
                    <View style={estilosHome.tituloComAlertaRow}>
                      <Text style={[estilosHome.produtoNome, { color: theme.text, fontSize: 13 * fontScale }]} numberOfLines={1}>
                        {item.nome_produto}
                      </Text>
                      {item.abaixoEstoqueMinimo && (
                        <Feather name="alert-triangle" size={14} color="#D97706" style={{ marginLeft: 2 }} />
                      )}
                    </View>

                    <Text style={[estilosHome.produtoMeta, { color: theme.subtext, fontSize: 10.5 * fontScale }]} numberOfLines={1}>
                      {item.categoria} • EAN: {item.codigo_barra_produto}
                    </Text>

                    {/* Texto com destaque em negrito para Estoque Baixo */}
                    <Text
                      style={[
                        estilosHome.produtoSub,
                        {
                          color:
                            item.criticidadeValidade === 'vencido'
                              ? '#B91C1C'
                              : item.criticidadeValidade === 'proximo_vencimento'
                              ? '#D97706'
                              : item.abaixoEstoqueMinimo
                              ? '#D97706'
                              : '#0369A1',
                          fontWeight: item.abaixoEstoqueMinimo ? '800' : '600',
                          fontSize: 10 * fontScale,
                        },
                      ]}
                    >
                      {item.criticidadeValidade === 'vencido'
                        ? 'Lote(s) com validade expirada'
                        : item.criticidadeValidade === 'proximo_vencimento'
                        ? 'Atenção: lote próximo do vencimento'
                        : item.abaixoEstoqueMinimo
                        ? `Estoque baixo: ${item.quantidade_total} de ${item.estoque_minimo} pacotes`
                        : `${item.lotes.length} lote(s) registrado(s)`}
                    </Text>
                  </View>

                  <View
                    style={[
                      estilosHome.badgeQtdConsolidada,
                      item.criticidadeValidade === 'vencido' && { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
                    ]}
                  >
                    <Text
                      style={[
                        estilosHome.badgeQtdNumero,
                        {
                          color: item.criticidadeValidade === 'vencido' ? '#B91C1C' : theme.primary,
                          fontSize: 12.5 * fontScale,
                        },
                      ]}
                    >
                      {item.quantidade_total}
                    </Text>
                    <Text
                      style={[
                        estilosHome.badgeQtdRotulo,
                        {
                          color: item.criticidadeValidade === 'vencido' ? '#B91C1C' : theme.primary,
                          fontSize: 8.5 * fontScale,
                        },
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
          <View style={estilosHome.gridContainer}>
            {itensFiltrados.map((item) => {
              const estiloVisual = obterEstiloCard(item.criticidadeValidade);

              return (
                <TouchableOpacity
                  key={item.codigo_barra_produto}
                  onPress={() => {
                    setProdutoSelecionado(item);
                    setModalLotesVisivel(true);
                  }}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nome_produto}, ${item.quantidade_total} pacotes`}
                  style={[
                    estilosHome.gridCard,
                    {
                      width: larguraCardGrid,
                      backgroundColor: estiloVisual.backgroundColor,
                      borderColor: estiloVisual.borderColor,
                    },
                  ]}
                >
                  <Image
                    source={
                      item.foto_url
                        ? { uri: item.foto_url }
                        : obterPlaceholderPorCategoria(item.categoria)
                    }
                    style={estilosHome.gridFoto}
                    resizeMode="cover"
                  />

                  <View style={estilosHome.gridConteudo}>
                    <View style={estilosHome.gridBadgeRow}>
                      <View
                        style={[
                          estilosHome.gridQtdBadge,
                          item.criticidadeValidade === 'vencido' && { backgroundColor: '#FEE2E2' },
                        ]}
                      >
                        <Text
                          style={[
                            estilosHome.gridQtdText,
                            {
                              color: item.criticidadeValidade === 'vencido' ? '#B91C1C' : theme.primary,
                              fontSize: 9 * fontScale,
                            },
                          ]}
                        >
                          {item.quantidade_total}p
                        </Text>
                      </View>
                      <Text style={[estilosHome.gridLotesText, { color: theme.subtext, fontSize: 8.5 * fontScale }]}>
                        {item.lotes.length} lotes
                      </Text>
                    </View>

                    {/* Título com ícone se estoque estiver baixo */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[estilosHome.gridTitulo, { color: theme.text, fontSize: 10.5 * fontScale, flexShrink: 1 }]} numberOfLines={2}>
                        {item.nome_produto}
                      </Text>
                      {item.abaixoEstoqueMinimo && (
                        <Feather name="alert-triangle" size={11} color="#D97706" style={{ marginLeft: 3 }} />
                      )}
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

      {/* Modal dos Lotes */}
      <Modal
        visible={modalLotesVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLotesVisivel(false)}
      >
        <View style={estilosHome.modalOverlay}>
          <View style={[estilosHome.modalCard, { backgroundColor: theme.surface }]}>
            <View style={estilosHome.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[estilosHome.modalProdutoNome, { color: theme.primary, fontSize: 15 * fontScale }]}>
                    {produtoSelecionado?.nome_produto}
                  </Text>
                  {produtoSelecionado?.abaixoEstoqueMinimo && (
                    <Feather name="alert-triangle" size={16} color="#D97706" />
                  )}
                </View>
                <Text style={[estilosHome.modalProdutoMeta, { color: theme.subtext, fontSize: 11 * fontScale }]}>
                  Código EAN: {produtoSelecionado?.codigo_barra_produto}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalLotesVisivel(false)}
                style={estilosHome.modalCloseBtn}
                accessibilityLabel="Fechar"
              >
                <Feather name="x" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={estilosHome.modalResumoBox}>
              <Text style={[estilosHome.modalResumoTexto, { color: theme.primary, fontSize: 12 * fontScale }]}>
                Total consolidado: <Text style={{ fontWeight: '800' }}>{produtoSelecionado?.quantidade_total} pacotes</Text>
                {produtoSelecionado?.abaixoEstoqueMinimo && (
                  <Text style={{ color: '#D97706', fontWeight: '800' }}> (Estoque baixo: mínimo {produtoSelecionado.estoque_minimo})</Text>
                )}
              </Text>
            </View>

            <Text style={[estilosHome.modalLotesTitulo, { color: theme.text, fontSize: 12.5 * fontScale }]}>
              Lotes disponíveis deste produto:
            </Text>

            <ScrollView style={{ maxHeight: 240 }}>
              {produtoSelecionado?.lotes.map((lote) => {
                const statusLote = avaliarStatusLote(lote);
                const isVencido = statusLote === 'vencido';
                const isProximo = statusLote === 'proximo_vencimento';

                return (
                  <View
                    key={lote.id_lote_produto}
                    style={[
                      estilosHome.loteCardItem,
                      {
                        borderColor: isVencido ? '#EF4444' : isProximo ? '#F59E0B' : '#E2E8F0',
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
                      Validade: {lote.data_validade_lote} {isVencido ? '(Vencido)' : isProximo ? '(Próximo do vencimento)' : ''}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setModalLotesVisivel(false)}
              style={[estilosHome.modalBtnPrimario, { backgroundColor: theme.primary }]}
            >
              <Text style={[estilosHome.modalBtnTexto, { fontSize: 12.5 * fontScale }]}>Fechar</Text>
            </TouchableOpacity>
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
                  accessibilityLabel={`Acessar ${item.titulo}`}
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
              accessibilityLabel={`Ir para ${widget.nome}`}
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
          accessibilityLabel="Abrir menu de mais telas"
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