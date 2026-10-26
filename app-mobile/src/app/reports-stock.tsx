// src/app/reports-stock.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosReportsStock } from '../styles/reports-stock.styles';
import { requisicaoApi } from '../services/api';

type CriterioOrdenacao = 'ALFABETICA' | 'QUANTIDADE' | 'VALIDADE';

export default function ReportsStockScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [lotes, setLotes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Toggle do Gráfico
  const [mostrarPorcentagem, setMostrarPorcentagem] = useState(true);
  
  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [mostrarAbaixoMinimo, setMostrarAbaixoMinimo] = useState(false);
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<CriterioOrdenacao>('ALFABETICA');
  const [direcaoAscendente, setDirecaoAscendente] = useState(true);

  const paletaCores = [theme.primary, tokens.colors.accentAmber500, theme.secondary, theme.danger, tokens.colors.neutral600];

  useEffect(() => {
    const carregarEstoque = async () => {
      try {
        const resposta: any = await requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        });

        if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
          setLotes(resposta.lotes);
        }
      } catch (erro) {
        Alert.alert('Erro', 'Não foi possível carregar os dados do estoque.');
      } finally {
        setCarregando(false);
      }
    };
    carregarEstoque();
  }, []);

  const dadosGrafico = useMemo(() => {
    const agregacao: Record<string, number> = {};
    let totalPacotes = 0;

    lotes.forEach((lote) => {
      const cat = lote.categoria || 'Outros';
      const qtd = parseInt(lote.quantidade_atual_pacote, 10) || 0;
      agregacao[cat] = (agregacao[cat] || 0) + qtd;
      totalPacotes += qtd;
    });

    return Object.keys(agregacao).map((cat, idx) => ({
      label: cat,
      valor: totalPacotes > 0 ? Math.round((agregacao[cat] / totalPacotes) * 100) : 0,
      quantidade: agregacao[cat],
      cor: paletaCores[idx % paletaCores.length]
    })).sort((a, b) => b.valor - a.valor);
  }, [lotes]);

  const categoriasDisponiveis = useMemo(() => Array.from(new Set(lotes.map(l => l.categoria).filter(Boolean))), [lotes]);

  const produtosAgrupadosFiltrados = useMemo(() => {
    const mapaAgrupamento: Record<string, any> = {};
    
    lotes.forEach(lote => {
      const ean = lote.codigo_barra_produto || lote.id_produto;
      if (!mapaAgrupamento[ean]) {
        mapaAgrupamento[ean] = {
          ean,
          nome: lote.nome_produto,
          categoria: lote.categoria,
          estoqueMinimo: parseInt(lote.estoque_minimo_pacote, 10) || 10,
          quantidadeTotal: 0,
          lotes: []
        };
      }
      mapaAgrupamento[ean].quantidadeTotal += (parseInt(lote.quantidade_atual_pacote, 10) || 0);
      mapaAgrupamento[ean].lotes.push(lote);
    });

    let listaProdutos = Object.values(mapaAgrupamento);

    const termo = termoBusca.toLowerCase().trim();
    if (termo) {
      listaProdutos = listaProdutos.filter(p => p.nome?.toLowerCase().includes(termo) || p.ean?.includes(termo));
    }
    if (categoriasSelecionadas.length > 0) {
      listaProdutos = listaProdutos.filter(p => categoriasSelecionadas.includes(p.categoria));
    }
    if (mostrarAbaixoMinimo) {
      listaProdutos = listaProdutos.filter(p => p.quantidadeTotal < p.estoqueMinimo);
    }

    listaProdutos.sort((a, b) => {
      let res = 0;
      if (criterioOrdenacao === 'ALFABETICA') res = (a.nome || '').localeCompare(b.nome || '');
      if (criterioOrdenacao === 'QUANTIDADE') res = a.quantidadeTotal - b.quantidadeTotal;
      if (criterioOrdenacao === 'VALIDADE') {
         const getMinDate = (prods: any) => prods.lotes.map((l:any) => l.data_validade_lote).sort()[0] || '9999-99-99';
         res = getMinDate(a).localeCompare(getMinDate(b));
      }
      return direcaoAscendente ? res : -res;
    });

    return listaProdutos;
  }, [lotes, termoBusca, categoriasSelecionadas, mostrarAbaixoMinimo, criterioOrdenacao, direcaoAscendente]);

  const alternarCategoria = (cat: string) => {
    setCategoriasSelecionadas(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const alternarCriterio = (criterio: CriterioOrdenacao) => {
    if (criterioOrdenacao === criterio) {
      setDirecaoAscendente(!direcaoAscendente);
    } else {
      setCriterioOrdenacao(criterio);
      setDirecaoAscendente(true);
    }
  };

  if (carregando) return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={[estilosReportsStock.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsStock.rolagem} keyboardShouldPersistTaps="handled">
        
        {/* BOTÃO DE VOLTAR */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a página anterior"
          onPress={() => roteador.back()}
          style={estilosReportsStock.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={[estilosReportsStock.textoBotaoVoltar, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosReportsStock.cabecalho}>
          <Text style={[estilosReportsStock.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Relatório de Estoque Atual
          </Text>
          <Text style={[estilosReportsStock.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Listagem contínua e minimalista de todos os itens e seus lotes.
          </Text>
        </View>

        {/* GRÁFICO FIXO DE BARRAS */}
        <View style={[estilosReportsStock.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={estilosReportsStock.tituloSecaoRow}>
            <Text style={[estilosReportsStock.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale }]}>
              Balanço por Categorias
            </Text>
            <TouchableOpacity 
              onPress={() => setMostrarPorcentagem(!mostrarPorcentagem)}
              style={[estilosReportsStock.btnToggleMetrica, { backgroundColor: `${theme.primary}15` }]}
            >
              <Feather name="refresh-ccw" size={12} color={theme.primary} />
              <Text style={[estilosReportsStock.btnToggleTexto, { color: theme.primary }]}>
                {mostrarPorcentagem ? 'Ver Quantidade' : 'Ver Porcentagem'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={estilosReportsStock.barraContainer}>
            {dadosGrafico.length === 0 && <Text style={{ color: theme.subtext }}>Sem dados.</Text>}
            {dadosGrafico.map(item => (
              <View key={item.label} style={estilosReportsStock.linhaBarra}>
                <View style={estilosReportsStock.rotuloBarraRow}>
                  <Text style={[estilosReportsStock.rotuloBarraTexto, { color: theme.text, fontSize: 12 * fontScale }]}>{item.label}</Text>
                  <Text style={[estilosReportsStock.rotuloBarraValor, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                    {mostrarPorcentagem ? `${item.valor}%` : `${item.quantidade} un`}
                  </Text>
                </View>
                <View style={[estilosReportsStock.trilhoBarra, { backgroundColor: theme.border }]}>
                  <View style={[estilosReportsStock.preenchimentoBarra, { width: `${item.valor}%`, backgroundColor: item.cor }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FILTROS AVANÇADOS */}
        <View style={estilosReportsStock.searchBarRow}>
          <View style={[estilosReportsStock.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Buscar item ou código EAN..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[estilosReportsStock.searchInput, { color: theme.text, fontSize: 13 * fontScale }]}
            />
          </View>
          <TouchableOpacity
            onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
            style={[estilosReportsStock.btnBuscaAvancada, { backgroundColor: buscaAvancadaAberta ? `${theme.primary}15` : theme.surface, borderColor: buscaAvancadaAberta ? theme.primary : theme.border }]}
          >
            <Feather name="sliders" size={18} color={buscaAvancadaAberta ? theme.primary : '#475569'} />
          </TouchableOpacity>
        </View>

        {buscaAvancadaAberta && (
          <View style={[estilosReportsStock.gavetaFiltros, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[estilosReportsStock.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>Filtrar Categorias:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilosReportsStock.scrollCategoriasContainer}>
              {categoriasDisponiveis.map(cat => {
                const ativo = categoriasSelecionadas.includes(cat);
                return (
                  <TouchableOpacity 
                    key={cat} onPress={() => alternarCategoria(cat)}
                    style={[estilosReportsStock.chipCategoria, { backgroundColor: ativo ? theme.primary : theme.background, borderColor: ativo ? theme.primary : theme.border }]}
                  >
                    <Text style={{ color: ativo ? '#FFF' : theme.text, fontSize: 11 * fontScale }}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[estilosReportsStock.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale, marginTop: 12 }]}>Ordenar Resultados:</Text>
            <View style={estilosReportsStock.botoesWrapRow}>
              <TouchableOpacity onPress={() => alternarCriterio('ALFABETICA')} style={[estilosReportsStock.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'ALFABETICA' ? theme.primary : theme.surface, borderColor: criterioOrdenacao === 'ALFABETICA' ? theme.primary : theme.border }]}>
                <Feather name="type" size={14} color={criterioOrdenacao === 'ALFABETICA' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'ALFABETICA' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Nome {criterioOrdenacao === 'ALFABETICA' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alternarCriterio('QUANTIDADE')} style={[estilosReportsStock.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'QUANTIDADE' ? theme.primary : theme.surface, borderColor: criterioOrdenacao === 'QUANTIDADE' ? theme.primary : theme.border }]}>
                <Feather name="layers" size={14} color={criterioOrdenacao === 'QUANTIDADE' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'QUANTIDADE' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Saldo {criterioOrdenacao === 'QUANTIDADE' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => setMostrarAbaixoMinimo(!mostrarAbaixoMinimo)}
              style={[estilosReportsStock.btnFiltroMinimo, { 
                backgroundColor: mostrarAbaixoMinimo ? `${tokens.colors.accentAmber500}15` : theme.surface,
                borderColor: mostrarAbaixoMinimo ? tokens.colors.accentAmber500 : theme.border 
              }]}
            >
              <Feather name={mostrarAbaixoMinimo ? "check-square" : "square"} size={16} color={mostrarAbaixoMinimo ? tokens.colors.accentAmber500 : theme.text} />
              <Text style={[estilosReportsStock.textoFiltroMinimo, { color: mostrarAbaixoMinimo ? tokens.colors.accentAmber500 : theme.text }]}>
                Apenas itens abaixo do Estoque Mínimo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LISTAGEM CONTÍNUA MINIMALISTA SEM CABEÇALHO DE TABELA */}
        {produtosAgrupadosFiltrados.length > 0 ? (
          <View style={[estilosReportsStock.tabelaContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {produtosAgrupadosFiltrados.map((produto, idx) => {
              const isEstoqueBaixo = produto.quantidadeTotal < produto.estoqueMinimo;
              
              return (
                <View 
                  key={produto.ean || idx} 
                  style={{ 
                    borderBottomWidth: idx === produtosAgrupadosFiltrados.length - 1 ? 0 : 4, 
                    borderBottomColor: theme.background 
                  }}
                >
                  {/* AGRUPADOR DO PRODUTO */}
                  <View style={estilosReportsStock.produtoHeaderMinimalista}>
                    <View style={estilosReportsStock.produtoNomeRow}>
                      <Text style={[estilosReportsStock.produtoNome, { color: theme.text, fontSize: 14 * fontScale }]} numberOfLines={1}>
                        {produto.nome}
                      </Text>
                      {isEstoqueBaixo && (
                        <Feather name="alert-triangle" size={14} color={tokens.colors.accentAmber500} style={estilosReportsStock.iconeAvisoEstoque} />
                      )}
                    </View>
                    <Text style={[estilosReportsStock.produtoSub, { color: theme.subtext }]}>
                      EAN: {produto.ean} • Saldo: <Text style={{ color: isEstoqueBaixo ? tokens.colors.accentAmber500 : theme.text, fontWeight: 'bold' }}>{produto.quantidadeTotal} un</Text>
                    </Text>
                  </View>

                  {/* LOTES */}
                  {produto.lotes.map((lote: any, i: number) => {
                    const isVencido = lote.status_validade_lote?.includes('vencido');
                    const corTextoLinha = isVencido ? theme.danger : theme.text;
                    const fontWeightLinha = isVencido ? 'bold' : '500';

                    return (
                      <View 
                        key={lote.id_lote_produto || i} 
                        style={[
                          estilosReportsStock.loteContainer, 
                          { borderBottomColor: theme.border, borderBottomWidth: i === produto.lotes.length - 1 ? 0 : 1 }
                        ]}
                      >
                        {/* Linha 1: Localização */}
                        <View style={estilosReportsStock.linhaLocal}>
                          <Text style={[estilosReportsStock.textoLocal, { color: corTextoLinha }]} numberOfLines={2}>
                            {lote.local_descricao}
                          </Text>
                        </View>
                        
                        {/* Linha 2: Lote, Validade e Qtd */}
                        <View style={estilosReportsStock.linhaLoteValidade}>
                          <Text style={[estilosReportsStock.textoLoteValidade, { color: corTextoLinha, fontWeight: fontWeightLinha }]}>
                            Lote: {lote.numero_codigo_lote}
                          </Text>
                          <Text style={[estilosReportsStock.textoLoteValidade, { color: corTextoLinha, fontWeight: fontWeightLinha }]}>
                            Validade: {lote.data_validade_lote}
                          </Text>
                          <Text style={[estilosReportsStock.textoLoteValidade, { color: corTextoLinha, fontWeight: 'bold' }]}>
                            Qtd: {lote.quantidade_atual_pacote}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={{ textAlign: 'center', color: theme.subtext, marginVertical: 20 }}>
            Nenhum produto corresponde aos filtros aplicados.
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}