// src/app/stock-details.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosStockDetails } from '../styles/stock-details.styles';
import { requisicaoApi } from '../services/api';

interface LoteItem {
  id_lote_produto: string;
  id_produto: string;
  nome_produto: string;
  categoria: string;
  codigo_barra_produto: string;
  numero_codigo_lote: string;
  quantidade_atual_pacote: number;
  data_validade_lote: string;
  local_descricao: string;
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

export default function StockDetailsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const { width: larguraJanela } = useWindowDimensions();

  const [lotesRaw, setLotesRaw] = useState<LoteItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [modoExibicao, setModoExibicao] = useState<'lista' | 'grid'>('lista');

  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);
  const [modalLotesVisivel, setModalLotesVisivel] = useState(false);

  // 🚀 Placeholders em formato .png oficiais
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

  const carregarEstoque = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        // Ignora lotes com quantidade zero
        const lotesProcessados = resposta.lotes
          .filter((l: any) => Number(l.quantidade_atual_pacote) > 0)
          .map((l: any) => ({
            ...l,
            data_ms: converterDataParaMs(l.data_validade_lote),
            quantidade_atual_pacote: Number(l.quantidade_atual_pacote)
          }));
        
        setLotesRaw(lotesProcessados);
      } else {
        setLotesRaw([]);
      }
    } catch (erro) {
      Alert.alert('Erro', 'Falha ao buscar detalhes dos lotes na nuvem.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstoque();
  }, [carregarEstoque]);

  const catalogoAgrupado = useMemo(() => {
    const mapa = new Map<string, ProdutoAgrupado>();

    lotesRaw.forEach((lote) => {
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

    let lista = Array.from(mapa.values());
    lista.forEach(p => p.lotes.sort((a, b) => a.data_ms - b.data_ms));
    return lista.sort((a, b) => a.nome_produto.localeCompare(b.nome_produto));
  }, [lotesRaw]);

  const produtosFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();
    if (!termo) return catalogoAgrupado;
    return catalogoAgrupado.filter(
      p => p.nome_produto.toLowerCase().includes(termo) || p.codigo_barra_produto.includes(termo) || p.categoria.toLowerCase().includes(termo)
    );
  }, [catalogoAgrupado, pesquisa]);


  // Calculando largura para o modo Grid (3 colunas)
  const paddingLateral = 16;
  const espacoEntreCards = 8;
  const larguraDisponivel = larguraJanela - paddingLateral * 2;
  const larguraCardGrid = Math.floor((larguraDisponivel - espacoEntreCards * 2) / 3);

  return (
    <SafeAreaView style={[estilosStockDetails.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockDetails.rolagem} keyboardShouldPersistTaps="handled">
        
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={estilosStockDetails.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={[estilosStockDetails.textoBotaoVoltar, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosStockDetails.cabecalho}>
          <Text style={[estilosStockDetails.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Consulta de Estoque
          </Text>
          <Text style={[estilosStockDetails.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Pesquise um produto para consultar todos os lotes ativos, sua distribuição em locais e suas datas de validade.
          </Text>
        </View>

        <View style={estilosStockDetails.searchBarRow}>
          <View style={[estilosStockDetails.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Pesquisar catálogo por nome ou EAN..."
              placeholderTextColor="#94A3B8"
              value={pesquisa}
              onChangeText={setPesquisa}
              style={[estilosStockDetails.searchInput, { color: theme.text, fontSize: 12.5 * fontScale }]}
            />
            {pesquisa.length > 0 && (
              <TouchableOpacity onPress={() => setPesquisa('')}>
                <Feather name="x-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <View style={estilosStockDetails.toggleGroup}>
            <TouchableOpacity
              onPress={() => setModoExibicao('lista')}
              style={[estilosStockDetails.toggleBtn, modoExibicao === 'lista' && estilosStockDetails.toggleBtnActive]}
            >
              <Feather name="list" size={16} color={modoExibicao === 'lista' ? theme.primary : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModoExibicao('grid')}
              style={[estilosStockDetails.toggleBtn, modoExibicao === 'grid' && estilosStockDetails.toggleBtnActive]}
            >
              <Feather name="grid" size={16} color={modoExibicao === 'grid' ? theme.primary : '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : produtosFiltrados.length === 0 ? (
          <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>
            Nenhum produto localizado no estoque.
          </Text>
        ) : modoExibicao === 'lista' ? (
          <View style={{ gap: 8 }}>
            {produtosFiltrados.map((item) => (
              <TouchableOpacity
                key={item.codigo_barra_produto}
                onPress={() => {
                  setProdutoSelecionado(item);
                  setModalLotesVisivel(true);
                }}
                activeOpacity={0.8}
                style={[estilosStockDetails.listaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Image
                  source={item.foto_url ? { uri: item.foto_url } : obterPlaceholderPorCategoria(item.categoria)}
                  style={estilosStockDetails.listaFoto}
                  resizeMode="cover"
                />

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={[estilosStockDetails.produtoNome, { color: theme.text, fontSize: 13 * fontScale }]} numberOfLines={1}>
                    {item.nome_produto}
                  </Text>
                  <Text style={[estilosStockDetails.produtoMeta, { color: theme.subtext, fontSize: 10.5 * fontScale }]} numberOfLines={1}>
                    {item.categoria} • EAN: {item.codigo_barra_produto}
                  </Text>
                  <Text style={[estilosStockDetails.produtoSub, { color: theme.primary, fontSize: 10 * fontScale }]}>
                    {item.lotes.length} lote(s) registrado(s)
                  </Text>
                </View>

                <View style={[estilosStockDetails.badgeQtdConsolidada, { borderColor: theme.border }]}>
                  <Text style={[estilosStockDetails.badgeQtdNumero, { color: theme.primary, fontSize: 12.5 * fontScale }]}>
                    {item.quantidade_total}
                  </Text>
                  <Text style={[estilosStockDetails.badgeQtdRotulo, { color: theme.primary, fontSize: 8.5 * fontScale }]}>
                    pcts
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={estilosStockDetails.gridContainer}>
            {produtosFiltrados.map((item) => (
              <TouchableOpacity
                key={item.codigo_barra_produto}
                onPress={() => {
                  setProdutoSelecionado(item);
                  setModalLotesVisivel(true);
                }}
                activeOpacity={0.8}
                style={[estilosStockDetails.gridCard, { width: larguraCardGrid, backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Image
                  source={item.foto_url ? { uri: item.foto_url } : obterPlaceholderPorCategoria(item.categoria)}
                  style={estilosStockDetails.gridFoto}
                  resizeMode="cover"
                />

                <View style={estilosStockDetails.gridConteudo}>
                  <View style={estilosStockDetails.gridBadgeRow}>
                    <View style={estilosStockDetails.gridQtdBadge}>
                      <Text style={[estilosStockDetails.gridQtdText, { color: theme.primary, fontSize: 9 * fontScale }]}>
                        {item.quantidade_total}p
                      </Text>
                    </View>
                    <Text style={[estilosStockDetails.gridLotesText, { color: theme.subtext, fontSize: 8.5 * fontScale }]}>
                      {item.lotes.length} lotes
                    </Text>
                  </View>
                  <Text style={[estilosStockDetails.gridTitulo, { color: theme.text, fontSize: 10.5 * fontScale }]} numberOfLines={2}>
                    {item.nome_produto}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 🚀 MODAL DOS LOTES E FICHA TÉCNICA - CAPA FULL WIDTH */}
      <Modal
        visible={modalLotesVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLotesVisivel(false)}
      >
        <View style={estilosStockDetails.modalOverlay}>
          <View style={estilosStockDetails.modalCard}>
            
            <View style={estilosStockDetails.modalCapaContainer}>
              <TouchableOpacity
                onPress={() => setModalLotesVisivel(false)}
                style={estilosStockDetails.modalCloseBtnAbsolute}
                accessibilityLabel="Fechar"
              >
                <Feather name="x" size={18} color="#000000" />
              </TouchableOpacity>
              
              <Image
                source={produtoSelecionado?.foto_url ? { uri: produtoSelecionado.foto_url } : obterPlaceholderPorCategoria(produtoSelecionado?.categoria || '')}
                style={estilosStockDetails.modalProdutoFotoCapa}
                resizeMode="cover"
              />
            </View>

            <View style={estilosStockDetails.modalConteudoBox}>
              <Text style={[estilosStockDetails.modalProdutoNomeCenter, { color: theme.primary, fontSize: 17 * fontScale }]} numberOfLines={2}>
                {produtoSelecionado?.nome_produto}
              </Text>
              <Text style={[estilosStockDetails.modalProdutoMetaCenter, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                {produtoSelecionado?.categoria} • EAN: {produtoSelecionado?.codigo_barra_produto}
              </Text>

              <View style={estilosStockDetails.modalResumoBox}>
                <Text style={[estilosStockDetails.modalResumoTexto, { color: theme.primary, fontSize: 12.5 * fontScale }]}>
                  Estoque atual consolidado: <Text style={{ fontWeight: '800' }}>{produtoSelecionado?.quantidade_total} pacotes</Text>
                </Text>
              </View>

              <Text style={[estilosStockDetails.modalLotesTitulo, { color: theme.text, fontSize: 13 * fontScale }]}>
                Lotes registrados deste produto:
              </Text>

              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {produtoSelecionado?.lotes.map((lote) => {
                  const statusLote = avaliarStatusLote(lote.data_validade_lote);
                  const isVencido = statusLote === 'vencido';
                  const isProximo = statusLote === 'proximo_vencimento';

                  return (
                    <View
                      key={lote.id_lote_produto}
                      style={[
                        estilosStockDetails.loteCardItem,
                        {
                          borderColor: isVencido ? '#EF4444' : isProximo ? '#FCD34D' : '#E2E8F0',
                          backgroundColor: isVencido ? '#FEE2E2' : isProximo ? '#FEFDF8' : '#F8FAFC',
                        },
                      ]}
                    >
                      <View style={estilosStockDetails.loteLinhaTopo}>
                        <Text style={[estilosStockDetails.loteCodigo, { color: theme.text, fontSize: 11.5 * fontScale }]}>
                          Lote: {lote.numero_codigo_lote}
                        </Text>
                        <Text style={[estilosStockDetails.loteQtd, { color: isVencido ? '#B91C1C' : theme.primary, fontSize: 11.5 * fontScale }]}>
                          {lote.quantidade_atual_pacote} pacotes
                        </Text>
                      </View>

                      <Text style={[estilosStockDetails.loteLocal, { color: theme.subtext, fontSize: 10.5 * fontScale }]}>
                        Local: {lote.local_descricao}
                      </Text>

                      <Text
                        style={[
                          estilosStockDetails.loteValidade,
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
                style={[estilosStockDetails.modalBtnPrimario, { backgroundColor: theme.primary }]}
              >
                <Text style={[estilosStockDetails.modalBtnTexto, { fontSize: 13 * fontScale }]}>Fechar e Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}