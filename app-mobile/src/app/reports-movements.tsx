// src/app/reports-movements.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosReportsMovements } from '../styles/reports-movements.styles';
import { requisicaoApi } from '../services/api';

type CriterioOrdenacao = 'ALFABETICA' | 'VOLUME' | 'DATA';

export default function ReportsMovementsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Toggle do Gráfico
  const [mostrarPorcentagem, setMostrarPorcentagem] = useState(true);
  
  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [operacoesSelecionadas, setOperacoesSelecionadas] = useState<string[]>([]);
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<CriterioOrdenacao>('DATA');
  const [direcaoAscendente, setDirecaoAscendente] = useState(false);

  // Busca APENAS DADOS REAIS da AWS, sem mocks de fallback
  useEffect(() => {
    const carregarMovimentacoes = async () => {
      try {
        const resposta: any = await requisicaoApi('/api/relatorios', {
          metodo: 'POST',
          dados: { modulo: 'relatorios', acao: 'consultar_movimentacoes' },
        });

        if (resposta?.sucesso && Array.isArray(resposta.movimentacoes)) {
          setMovimentacoes(resposta.movimentacoes);
        } else {
          setMovimentacoes([]);
        }
      } catch (erro) {
        Alert.alert('Erro', 'Não foi possível carregar os dados de movimentação da AWS.');
        setMovimentacoes([]);
      } finally {
        setCarregando(false);
      }
    };
    carregarMovimentacoes();
  }, []);

  const dadosGrafico = useMemo(() => {
    const agregacao: Record<string, number> = { 'Entrada': 0, 'Saída': 0, 'Transferência': 0 };
    let totalItens = 0;

    movimentacoes.forEach((mov) => {
      const op = mov.operacao || mov.tipo_operacao || 'Outros';
      
      // Normalização de nomes (saída/saida) para agrupar corretamente
      const opNormalizada = op.toLowerCase().includes('saída') || op.toLowerCase().includes('saida') ? 'Saída' : 
                            op.toLowerCase().includes('entrada') ? 'Entrada' : 
                            op.toLowerCase().includes('trans') ? 'Transferência' : 'Outros';

      const qtd = parseInt(mov.qtd || mov.quantidade_movimentada_pacote, 10) || 0;
      if (agregacao[opNormalizada] !== undefined) {
        agregacao[opNormalizada] += qtd;
        totalItens += qtd;
      }
    });

    const cores = {
      'Entrada': theme.secondary, 
      'Saída': theme.danger, 
      'Transferência': theme.primary, 
    };

    return Object.keys(agregacao)
      .filter(op => agregacao[op] > 0)
      .map((op) => ({
        label: op,
        valor: totalItens > 0 ? Math.round((agregacao[op] / totalItens) * 100) : 0,
        quantidade: agregacao[op],
        cor: (cores as any)[op] || theme.text
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [movimentacoes, theme]);

  const operacoesDisponiveis = ['Entrada', 'Saída', 'Transferência'];

  const produtosAgrupadosFiltrados = useMemo(() => {
    const mapaAgrupamento: Record<string, any> = {};
    
    movimentacoes.forEach(mov => {
      const ean = mov.ean || mov.id_produto || mov.id;
      if (!mapaAgrupamento[ean]) {
        mapaAgrupamento[ean] = {
          ean,
          nome: mov.nome || mov.nome_produto,
          volumeMovimentado: 0,
          historico: []
        };
      }
      mapaAgrupamento[ean].volumeMovimentado += (parseInt(mov.qtd || mov.quantidade_movimentada_pacote, 10) || 0);
      mapaAgrupamento[ean].historico.push(mov);
    });

    let listaProdutos = Object.values(mapaAgrupamento);

    const termo = termoBusca.toLowerCase().trim();
    if (termo) {
      listaProdutos = listaProdutos.filter(p => p.nome?.toLowerCase().includes(termo) || p.ean?.includes(termo));
    }

    if (operacoesSelecionadas.length > 0) {
      listaProdutos = listaProdutos.map(p => {
        const historicoFiltrado = p.historico.filter((h: any) => {
           const opReal = h.operacao || h.tipo_operacao || '';
           const opNorm = opReal.toLowerCase().includes('saí') || opReal.toLowerCase().includes('sai') ? 'Saída' : 
                          opReal.toLowerCase().includes('ent') ? 'Entrada' : 
                          opReal.toLowerCase().includes('trans') ? 'Transferência' : '';
           return operacoesSelecionadas.includes(opNorm);
        });
        return { ...p, historico: historicoFiltrado };
      }).filter(p => p.historico.length > 0);
    }

    listaProdutos.sort((a, b) => {
      let res = 0;
      if (criterioOrdenacao === 'ALFABETICA') res = (a.nome || '').localeCompare(b.nome || '');
      if (criterioOrdenacao === 'VOLUME') res = a.volumeMovimentado - b.volumeMovimentado;
      if (criterioOrdenacao === 'DATA') {
         const getMaxDate = (prods: any) => prods.historico.map((h:any) => h.data || h.data_hora_movimentacao).sort().reverse()[0] || '';
         res = getMaxDate(a).localeCompare(getMaxDate(b));
      }
      return direcaoAscendente ? res : -res;
    });

    listaProdutos.forEach(p => {
      p.historico.sort((a: any, b: any) => {
         const dataA = a.data || a.data_hora_movimentacao || '';
         const dataB = b.data || b.data_hora_movimentacao || '';
         return dataB.localeCompare(dataA);
      });
    });

    return listaProdutos;
  }, [movimentacoes, termoBusca, operacoesSelecionadas, criterioOrdenacao, direcaoAscendente]);

  const alternarOperacao = (op: string) => {
    setOperacoesSelecionadas(prev => prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]);
  };

  const alternarCriterio = (criterio: CriterioOrdenacao) => {
    if (criterioOrdenacao === criterio) {
      setDirecaoAscendente(!direcaoAscendente);
    } else {
      setCriterioOrdenacao(criterio);
      setDirecaoAscendente(criterio === 'ALFABETICA');
    }
  };

  if (carregando) return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={[estilosReportsMovements.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsMovements.rolagem} keyboardShouldPersistTaps="handled">
        
        {/* BOTÃO DE VOLTAR */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={estilosReportsMovements.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={[estilosReportsMovements.textoBotaoVoltar, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosReportsMovements.cabecalho}>
          <Text style={[estilosReportsMovements.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Relatório de Movimentações
          </Text>
          <Text style={[estilosReportsMovements.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Histórico contínuo de entradas, saídas e transferências.
          </Text>
        </View>

        {/* GRÁFICO FIXO DE BARRAS */}
        <View style={[estilosReportsMovements.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={estilosReportsMovements.tituloSecaoRow}>
            <Text style={[estilosReportsMovements.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale }]}>
              Balanço Operacional
            </Text>
            <TouchableOpacity 
              onPress={() => setMostrarPorcentagem(!mostrarPorcentagem)}
              style={[estilosReportsMovements.btnToggleMetrica, { backgroundColor: `${theme.primary}15` }]}
            >
              <Feather name="refresh-ccw" size={12} color={theme.primary} />
              <Text style={[estilosReportsMovements.btnToggleTexto, { color: theme.primary }]}>
                {mostrarPorcentagem ? 'Ver Volume' : 'Ver Porcentagem'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={estilosReportsMovements.barraContainer}>
            {dadosGrafico.length === 0 && <Text style={{ color: theme.subtext }}>Sem dados.</Text>}
            {dadosGrafico.map(item => (
              <View key={item.label} style={estilosReportsMovements.linhaBarra}>
                <View style={estilosReportsMovements.rotuloBarraRow}>
                  <Text style={[estilosReportsMovements.rotuloBarraTexto, { color: theme.text, fontSize: 12 * fontScale }]}>{item.label}</Text>
                  <Text style={[estilosReportsMovements.rotuloBarraValor, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                    {mostrarPorcentagem ? `${item.valor}%` : `${item.quantidade} un`}
                  </Text>
                </View>
                <View style={[estilosReportsMovements.trilhoBarra, { backgroundColor: theme.border }]}>
                  <View style={[estilosReportsMovements.preenchimentoBarra, { width: `${item.valor}%`, backgroundColor: item.cor }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FILTROS AVANÇADOS */}
        <View style={estilosReportsMovements.searchBarRow}>
          <View style={[estilosReportsMovements.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Buscar produto ou EAN..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[estilosReportsMovements.searchInput, { color: theme.text, fontSize: 13 * fontScale }]}
            />
          </View>
          <TouchableOpacity
            onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
            style={[estilosReportsMovements.btnBuscaAvancada, { backgroundColor: buscaAvancadaAberta ? `${theme.primary}15` : theme.surface, borderColor: buscaAvancadaAberta ? theme.primary : theme.border }]}
          >
            <Feather name="sliders" size={18} color={buscaAvancadaAberta ? theme.primary : '#475569'} />
          </TouchableOpacity>
        </View>

        {buscaAvancadaAberta && (
          <View style={[estilosReportsMovements.gavetaFiltros, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[estilosReportsMovements.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>Filtrar Operação:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilosReportsMovements.scrollCategoriasContainer}>
              {operacoesDisponiveis.map(op => {
                const ativo = operacoesSelecionadas.includes(op);
                return (
                  <TouchableOpacity 
                    key={op} onPress={() => alternarOperacao(op)}
                    style={[estilosReportsMovements.chipFiltro, { backgroundColor: ativo ? theme.primary : theme.background, borderColor: ativo ? theme.primary : theme.border }]}
                  >
                    <Text style={{ color: ativo ? '#FFF' : theme.text, fontSize: 11 * fontScale }}>{op}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[estilosReportsMovements.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale, marginTop: 12 }]}>Ordenar Agrupamentos:</Text>
            <View style={estilosReportsMovements.botoesWrapRow}>
              <TouchableOpacity onPress={() => alternarCriterio('DATA')} style={[estilosReportsMovements.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'DATA' ? theme.primary : theme.surface, borderColor: criterioOrdenacao === 'DATA' ? theme.primary : theme.border }]}>
                <Feather name="clock" size={14} color={criterioOrdenacao === 'DATA' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'DATA' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Data {criterioOrdenacao === 'DATA' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alternarCriterio('ALFABETICA')} style={[estilosReportsMovements.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'ALFABETICA' ? theme.primary : theme.surface, borderColor: criterioOrdenacao === 'ALFABETICA' ? theme.primary : theme.border }]}>
                <Feather name="type" size={14} color={criterioOrdenacao === 'ALFABETICA' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'ALFABETICA' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Nome {criterioOrdenacao === 'ALFABETICA' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LISTAGEM CONTÍNUA MINIMALISTA AGRUPADA POR PRODUTO */}
        {produtosAgrupadosFiltrados.length > 0 ? (
          <View style={[estilosReportsMovements.tabelaContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {produtosAgrupadosFiltrados.map((produto, idx) => (
              <View 
                key={produto.ean || idx} 
                style={{ 
                  borderBottomWidth: idx === produtosAgrupadosFiltrados.length - 1 ? 0 : 4, 
                  borderBottomColor: theme.background 
                }}
              >
                {/* AGRUPADOR DO PRODUTO */}
                <View style={estilosReportsMovements.produtoHeaderMinimalista}>
                  <View style={estilosReportsMovements.produtoNomeRow}>
                    <Text style={[estilosReportsMovements.produtoNome, { color: theme.text, fontSize: 14 * fontScale }]} numberOfLines={1}>
                      {produto.nome}
                    </Text>
                  </View>
                  <Text style={[estilosReportsMovements.produtoSub, { color: theme.subtext }]}>
                    EAN: {produto.ean} • Vol. Movimentado: <Text style={{ color: theme.text, fontWeight: 'bold' }}>{produto.volumeMovimentado} un</Text>
                  </Text>
                </View>

                {/* HISTÓRICO DE MOVIMENTAÇÕES (Contínuo e Flat) */}
                {produto.historico.map((mov: any, i: number) => {
                  
                  const opOriginal = mov.operacao || mov.tipo_operacao || '';
                  const dataMov = mov.data || mov.data_hora_movimentacao || '';
                  const localMov = mov.local || mov.id_local_destino || mov.id_local_origem || 'Local não especificado';
                  const qtdMov = mov.qtd || mov.quantidade_movimentada_pacote || 0;
                  const respMov = mov.responsavel || mov.id_usuario_responsavel || 'Usuário';

                  // Cor semântica baseada na operação
                  let corOperacao = theme.text;
                  const opBusca = opOriginal.toLowerCase();
                  if (opBusca.includes('ent')) corOperacao = theme.secondary; // Verde
                  if (opBusca.includes('saí') || opBusca.includes('sai')) corOperacao = theme.danger; // Vermelho
                  if (opBusca.includes('trans')) corOperacao = theme.primary; // Azul

                  return (
                    <View 
                      key={mov.id || mov.id_movimentacao_estoque || i} 
                      style={[
                        estilosReportsMovements.movimentoContainer, 
                        { borderBottomColor: theme.border, borderBottomWidth: i === produto.historico.length - 1 ? 0 : 1 }
                      ]}
                    >
                      {/* Linha 1: Operação e Data */}
                      <View style={estilosReportsMovements.linhaOperacao}>
                        <Text style={[estilosReportsMovements.textoOperacao, { color: corOperacao }]}>
                          {opOriginal}
                        </Text>
                        <Text style={[estilosReportsMovements.textoDataHora, { color: theme.subtext }]}>
                          {dataMov.split('T')[0]}
                        </Text>
                      </View>
                      
                      {/* Linha 2: Localização Completa (Linha Única para não cortar) */}
                      <View style={estilosReportsMovements.linhaLocal}>
                        <Text style={[estilosReportsMovements.textoLocal, { color: theme.text }]} numberOfLines={2}>
                          {localMov}
                        </Text>
                      </View>

                      {/* Linha 3: Responsável e Quantidade (Lado a Lado) */}
                      <View style={estilosReportsMovements.linhaResponsavelQtd}>
                        <Text style={[estilosReportsMovements.textoDetalhes, { color: theme.subtext }]}>
                          Resp: <Text style={{ color: theme.text, fontWeight: '700' }}>{respMov}</Text>
                        </Text>
                        <Text style={[estilosReportsMovements.textoDetalhes, { color: corOperacao, fontWeight: 'bold' }]}>
                          Qtd: {qtdMov}
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
            Nenhuma movimentação corresponde aos filtros aplicados.
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}