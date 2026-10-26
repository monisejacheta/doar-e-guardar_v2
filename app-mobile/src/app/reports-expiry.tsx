// src/app/reports-expiry.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosReportsExpiry } from '../styles/reports-expiry.styles';
import { requisicaoApi } from '../services/api';

type CriterioOrdenacao = 'ALFABETICA' | 'VOLUME' | 'VALIDADE';

export default function ReportsExpiryScreen() {
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
  const [mostrarApenasCriticos, setMostrarApenasCriticos] = useState(false); // Vencidos ou < 7 dias
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<CriterioOrdenacao>('VALIDADE');
  const [direcaoAscendente, setDirecaoAscendente] = useState(true); // Padrão: Vencem primeiro (FEFO)

  useEffect(() => {
    const carregarEstoqueAWS = async () => {
      try {
        setCarregando(true);
        const resposta: any = await requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        });

        if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
          setLotes(resposta.lotes);
        } else {
          setLotes([]);
        }
      } catch (erro) {
        Alert.alert('Erro', 'Não foi possível carregar os lotes da AWS.');
        setLotes([]);
      } finally {
        setCarregando(false);
      }
    };
    carregarEstoqueAWS();
  }, []);

  // Helper: Converte e classifica a data de validade dinamicamente
  const analisarValidade = (dataLoteStr: string) => {
    if (!dataLoteStr) return { status: 'regular', cor: theme.secondary, ms: 9999999999999 };
    
    let dataValidade;
    if (dataLoteStr.includes('/')) {
      const [d, m, y] = dataLoteStr.split('/');
      dataValidade = new Date(`${y}-${m}-${d}T00:00:00`);
    } else {
      dataValidade = new Date(`${dataLoteStr}T00:00:00`);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const seteDiasFrente = new Date(hoje);
    seteDiasFrente.setDate(hoje.getDate() + 7);

    const ms = dataValidade.getTime();

    if (dataValidade < hoje) return { status: 'vencido', cor: theme.danger, ms };
    if (dataValidade <= seteDiasFrente) return { status: 'próximo', cor: tokens.colors.accentAmber500, ms };
    return { status: 'regular', cor: theme.secondary, ms }; // Verde Doar
  };

  // Gráfico: Balanço por STATUS DE VALIDADE (Em vez de categorias)
  const dadosGrafico = useMemo(() => {
    const agregacao = { 'Vencidos': 0, 'Próximos (7 dias)': 0, 'Regulares': 0 };
    let totalItens = 0;

    lotes.forEach((lote) => {
      const { status } = analisarValidade(lote.data_validade_lote);
      const qtd = parseInt(lote.quantidade_atual_pacote, 10) || 0;
      
      if (status === 'vencido') agregacao['Vencidos'] += qtd;
      else if (status === 'próximo') agregacao['Próximos (7 dias)'] += qtd;
      else agregacao['Regulares'] += qtd;
      
      totalItens += qtd;
    });

    const cores = {
      'Vencidos': theme.danger,
      'Próximos (7 dias)': tokens.colors.accentAmber500,
      'Regulares': theme.secondary,
    };

    return Object.keys(agregacao)
      .filter(k => agregacao[k as keyof typeof agregacao] > 0)
      .map((k) => ({
        label: k,
        valor: totalItens > 0 ? Math.round((agregacao[k as keyof typeof agregacao] / totalItens) * 100) : 0,
        quantidade: agregacao[k as keyof typeof agregacao],
        cor: cores[k as keyof typeof cores]
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [lotes, theme, tokens]);

  const categoriasDisponiveis = useMemo(() => Array.from(new Set(lotes.map(l => l.categoria || 'Outros').filter(Boolean))), [lotes]);

  // Agrupamento por Produto e Filtragem
  const produtosAgrupadosFiltrados = useMemo(() => {
    const mapaAgrupamento: Record<string, any> = {};
    
    lotes.forEach(lote => {
      const ean = lote.codigo_barra_produto || lote.id_produto || lote.id;
      const { status, cor, ms } = analisarValidade(lote.data_validade_lote);
      
      if (!mapaAgrupamento[ean]) {
        mapaAgrupamento[ean] = {
          ean,
          nome: lote.nome_produto || 'Produto Sem Nome',
          categoria: lote.categoria || 'Outros',
          volumeTotal: 0,
          lotes: [],
          temCritico: false,
          menorDataMs: ms
        };
      }
      
      mapaAgrupamento[ean].volumeTotal += (parseInt(lote.quantidade_atual_pacote, 10) || 0);
      mapaAgrupamento[ean].lotes.push({ ...lote, analise: { status, cor, ms } });
      
      if (status === 'vencido' || status === 'próximo') {
        mapaAgrupamento[ean].temCritico = true;
      }
      
      if (ms < mapaAgrupamento[ean].menorDataMs) {
        mapaAgrupamento[ean].menorDataMs = ms;
      }
    });

    let listaProdutos = Object.values(mapaAgrupamento);

    // Filtros Textuais e Categoria
    const termo = termoBusca.toLowerCase().trim();
    if (termo) {
      listaProdutos = listaProdutos.filter(p => p.nome.toLowerCase().includes(termo) || p.ean.includes(termo));
    }

    if (categoriasSelecionadas.length > 0) {
      listaProdutos = listaProdutos.filter(p => categoriasSelecionadas.includes(p.categoria));
    }

    // Toggle: Mostrar Apenas Itens Críticos
    if (mostrarApenasCriticos) {
      listaProdutos = listaProdutos.filter(p => p.temCritico);
      // Remove lotes regulares de dentro dos produtos filtrados para focar no problema
      listaProdutos.forEach(p => {
        p.lotes = p.lotes.filter((l: any) => l.analise.status !== 'regular');
      });
    }

    // Ordenação dos Produtos
    listaProdutos.sort((a, b) => {
      let res = 0;
      if (criterioOrdenacao === 'ALFABETICA') res = a.nome.localeCompare(b.nome);
      if (criterioOrdenacao === 'VOLUME') res = a.volumeTotal - b.volumeTotal;
      if (criterioOrdenacao === 'VALIDADE') res = a.menorDataMs - b.menorDataMs; // FEFO (Menor data sobe)
      
      return direcaoAscendente ? res : -res;
    });

    // Ordena os lotes internamente (Sempre FEFO - Menor data primeiro)
    listaProdutos.forEach(p => {
      p.lotes.sort((a: any, b: any) => a.analise.ms - b.analise.ms);
    });

    return listaProdutos;
  }, [lotes, termoBusca, categoriasSelecionadas, mostrarApenasCriticos, criterioOrdenacao, direcaoAscendente]);

  const alternarCategoria = (cat: string) => {
    setCategoriasSelecionadas(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const alternarCriterio = (criterio: CriterioOrdenacao) => {
    if (criterioOrdenacao === criterio) {
      setDirecaoAscendente(!direcaoAscendente);
    } else {
      setCriterioOrdenacao(criterio);
      setDirecaoAscendente(true); // Padrão
    }
  };

  if (carregando) return <ActivityIndicator size="large" color={tokens.colors.accentAmber500} style={{ marginTop: 40 }} />;

  // Verifica se existe algo vencido no geral (para banner de topo opcional)
  const totalVencidosGlobal = dadosGrafico.find(d => d.label === 'Vencidos')?.quantidade || 0;

  return (
    <SafeAreaView style={[estilosReportsExpiry.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsExpiry.rolagem} keyboardShouldPersistTaps="handled">
        
        {/* BOTÃO DE VOLTAR */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={estilosReportsExpiry.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={[estilosReportsExpiry.textoBotaoVoltar, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosReportsExpiry.cabecalho}>
          <Text style={[estilosReportsExpiry.titulo, { color: tokens.colors.accentAmber500, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Relatório de Validades
          </Text>
          <Text style={[estilosReportsExpiry.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Regra FEFO: Rastreio de lotes para priorização e prevenção de desperdícios.
          </Text>
        </View>

        {/* ALERTA CRÍTICO GERAL (Se houver vencidos no sistema) */}
        {totalVencidosGlobal > 0 && !mostrarApenasCriticos && (
          <View style={[estilosReportsExpiry.alertaVencidoContainer, { borderColor: theme.danger }]}>
            <View style={estilosReportsExpiry.alertaVencidoTituloRow}>
              <Feather name="alert-triangle" size={18} color={theme.danger} style={{ marginRight: 8 }} />
              <Text style={[estilosReportsExpiry.alertaVencidoTitulo, { color: theme.danger }]}>
                Atenção: {totalVencidosGlobal} Itens Vencidos!
              </Text>
            </View>
            <Text style={[estilosReportsExpiry.alertaVencidoTexto, { color: theme.danger }]}>
              Identificamos produtos com a data de validade expirada. Utilize o filtro "Visualizar apenas lotes críticos" abaixo para localizá-los rapidamente.
            </Text>
          </View>
        )}

        {/* GRÁFICO FIXO DE BARRAS (Status de Validade) */}
        <View style={[estilosReportsExpiry.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={estilosReportsExpiry.tituloSecaoRow}>
            <Text style={[estilosReportsExpiry.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale }]}>
              Balanço de Validade Global
            </Text>
            <TouchableOpacity 
              onPress={() => setMostrarPorcentagem(!mostrarPorcentagem)}
              style={[estilosReportsExpiry.btnToggleMetrica, { backgroundColor: `${theme.primary}15` }]}
            >
              <Feather name="refresh-ccw" size={12} color={theme.primary} />
              <Text style={[estilosReportsExpiry.btnToggleTexto, { color: theme.primary }]}>
                {mostrarPorcentagem ? 'Ver Quantidade' : 'Ver Porcentagem'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={estilosReportsExpiry.barraContainer}>
            {dadosGrafico.length === 0 && <Text style={{ color: theme.subtext }}>Sem dados de lote.</Text>}
            {dadosGrafico.map(item => (
              <View key={item.label} style={estilosReportsExpiry.linhaBarra}>
                <View style={estilosReportsExpiry.rotuloBarraRow}>
                  <Text style={[estilosReportsExpiry.rotuloBarraTexto, { color: theme.text, fontSize: 12 * fontScale }]}>{item.label}</Text>
                  <Text style={[estilosReportsExpiry.rotuloBarraValor, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                    {mostrarPorcentagem ? `${item.valor}%` : `${item.quantidade} un`}
                  </Text>
                </View>
                <View style={[estilosReportsExpiry.trilhoBarra, { backgroundColor: theme.border }]}>
                  <View style={[estilosReportsExpiry.preenchimentoBarra, { width: `${item.valor}%`, backgroundColor: item.cor }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FILTROS AVANÇADOS */}
        <View style={estilosReportsExpiry.searchBarRow}>
          <View style={[estilosReportsExpiry.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Buscar produto ou lote..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[estilosReportsExpiry.searchInput, { color: theme.text, fontSize: 13 * fontScale }]}
            />
          </View>
          <TouchableOpacity
            onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
            style={[estilosReportsExpiry.btnBuscaAvancada, { backgroundColor: buscaAvancadaAberta ? `${tokens.colors.accentAmber500}15` : theme.surface, borderColor: buscaAvancadaAberta ? tokens.colors.accentAmber500 : theme.border }]}
          >
            <Feather name="sliders" size={18} color={buscaAvancadaAberta ? tokens.colors.accentAmber500 : '#475569'} />
          </TouchableOpacity>
        </View>

        {buscaAvancadaAberta && (
          <View style={[estilosReportsExpiry.gavetaFiltros, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[estilosReportsExpiry.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>Filtrar Categorias:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilosReportsExpiry.scrollCategoriasContainer}>
              {categoriasDisponiveis.map(cat => {
                const ativo = categoriasSelecionadas.includes(cat);
                return (
                  <TouchableOpacity 
                    key={cat} onPress={() => alternarCategoria(cat)}
                    style={[estilosReportsExpiry.chipFiltro, { backgroundColor: ativo ? tokens.colors.accentAmber500 : theme.background, borderColor: ativo ? tokens.colors.accentAmber500 : theme.border }]}
                  >
                    <Text style={{ color: ativo ? '#FFF' : theme.text, fontSize: 11 * fontScale }}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[estilosReportsExpiry.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale, marginTop: 12 }]}>Ordenar Agrupamentos:</Text>
            <View style={estilosReportsExpiry.botoesWrapRow}>
              <TouchableOpacity onPress={() => alternarCriterio('VALIDADE')} style={[estilosReportsExpiry.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'VALIDADE' ? tokens.colors.accentAmber500 : theme.surface, borderColor: criterioOrdenacao === 'VALIDADE' ? tokens.colors.accentAmber500 : theme.border }]}>
                <Feather name="calendar" size={14} color={criterioOrdenacao === 'VALIDADE' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'VALIDADE' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Validade {criterioOrdenacao === 'VALIDADE' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alternarCriterio('ALFABETICA')} style={[estilosReportsExpiry.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'ALFABETICA' ? tokens.colors.accentAmber500 : theme.surface, borderColor: criterioOrdenacao === 'ALFABETICA' ? tokens.colors.accentAmber500 : theme.border }]}>
                <Feather name="type" size={14} color={criterioOrdenacao === 'ALFABETICA' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'ALFABETICA' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Nome {criterioOrdenacao === 'ALFABETICA' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
            </View>

            {/* TOGGLE CRÍTICO */}
            <TouchableOpacity 
              onPress={() => setMostrarApenasCriticos(!mostrarApenasCriticos)}
              style={[estilosReportsExpiry.btnFiltroCritico, { 
                backgroundColor: mostrarApenasCriticos ? `${theme.danger}15` : theme.surface,
                borderColor: mostrarApenasCriticos ? theme.danger : theme.border 
              }]}
            >
              <Feather name={mostrarApenasCriticos ? "check-square" : "square"} size={16} color={mostrarApenasCriticos ? theme.danger : theme.text} />
              <Text style={[estilosReportsExpiry.textoFiltroCritico, { color: mostrarApenasCriticos ? theme.danger : theme.text }]}>
                Visualizar apenas lotes críticos
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LISTAGEM CONTÍNUA MINIMALISTA AGRUPADA POR PRODUTO */}
        {produtosAgrupadosFiltrados.length > 0 ? (
          <View style={[estilosReportsExpiry.tabelaContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {produtosAgrupadosFiltrados.map((produto, idx) => (
              <View 
                key={produto.ean || idx} 
                style={{ 
                  borderBottomWidth: idx === produtosAgrupadosFiltrados.length - 1 ? 0 : 4, 
                  borderBottomColor: theme.background 
                }}
              >
                {/* AGRUPADOR DO PRODUTO */}
                <View style={estilosReportsExpiry.produtoHeaderMinimalista}>
                  <View style={estilosReportsExpiry.produtoNomeRow}>
                    <Text style={[estilosReportsExpiry.produtoNome, { color: theme.text, fontSize: 14 * fontScale }]} numberOfLines={1}>
                      {produto.nome}
                    </Text>
                  </View>
                  <Text style={[estilosReportsExpiry.produtoSub, { color: theme.subtext }]}>
                    EAN: {produto.ean} • Saldo Total: <Text style={{ color: theme.text, fontWeight: 'bold' }}>{produto.volumeTotal} un</Text>
                  </Text>
                </View>

                {/* LISTA DE LOTES COM CORES DE ALERTA */}
                {produto.lotes.map((lote: any, i: number) => {
                  const analise = lote.analise;
                  const corBase = analise.cor;
                  
                  return (
                    <View 
                      key={lote.id_lote_produto || i} 
                      style={[
                        estilosReportsExpiry.loteContainer, 
                        { borderBottomColor: theme.border, borderBottomWidth: i === produto.lotes.length - 1 ? 0 : 1 }
                      ]}
                    >
                      {/* Linha 1: Local e Badge de Status */}
                      <View style={estilosReportsExpiry.linhaLocalStatus}>
                        <Text style={[estilosReportsExpiry.textoLocal, { color: theme.text }]} numberOfLines={1}>
                          {lote.local_descricao || 'Local não definido'}
                        </Text>
                        
                        <View style={[estilosReportsExpiry.badgeStatus, { backgroundColor: `${corBase}20` }]}>
                          <Text style={[estilosReportsExpiry.textoStatus, { color: corBase }]}>
                            {analise.status}
                          </Text>
                        </View>
                      </View>

                      {/* Linha 2: Lote, Validade e Qtd (Todos na cor do Status) */}
                      <View style={estilosReportsExpiry.linhaDetalhes}>
                        <Text style={[estilosReportsExpiry.textoDetalhes, { color: corBase, fontWeight: '600' }]}>
                          Lote: {lote.numero_codigo_lote}
                        </Text>
                        <Text style={[estilosReportsExpiry.textoDetalhes, { color: corBase, fontWeight: '800' }]}>
                          Val: {lote.data_validade_lote}
                        </Text>
                        <Text style={[estilosReportsExpiry.textoDetalhes, { color: corBase, fontWeight: '900' }]}>
                          Qtd: {lote.quantidade_atual_pacote}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ textAlign: 'center', color: theme.subtext, marginVertical: 20 }}>
            Nenhum lote corresponde aos critérios de pesquisa.
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}