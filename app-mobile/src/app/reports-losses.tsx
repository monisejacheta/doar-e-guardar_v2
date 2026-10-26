// src/app/reports-losses.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosReportsLosses } from '../styles/reports-losses.styles';
import { requisicaoApi } from '../services/api';

type CriterioOrdenacao = 'ALFABETICA' | 'VOLUME' | 'DATA';

export default function ReportsLossesScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [perdas, setPerdas] = useState<any[]>([]);
  const [vencidosPendentes, setVencidosPendentes] = useState<any[]>([]); 
  const [carregando, setCarregando] = useState(true);
  
  const [mostrarPorcentagem, setMostrarPorcentagem] = useState(true);
  
  const [termoBusca, setTermoBusca] = useState('');
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<CriterioOrdenacao>('DATA');
  const [direcaoAscendente, setDirecaoAscendente] = useState(false);

  useEffect(() => {
    const carregarDadosAWS = async () => {
      try {
        setCarregando(true);
        const [respostaMov, respostaEstoque]: any = await Promise.all([
          requisicaoApi('/api/relatorios', {
            metodo: 'POST',
            dados: { modulo: 'relatorios', acao: 'consultar_movimentacoes' },
          }),
          requisicaoApi('/api/estoque', {
            metodo: 'POST',
            dados: { modulo: 'estoque', acao: 'consultar_estoque' },
          })
        ]);

        // Processa Perdas Históricas
        if (respostaMov?.sucesso && Array.isArray(respostaMov.movimentacoes)) {
          const apenasPerdas = respostaMov.movimentacoes.filter((m: any) => {
            const op = (m.operacao || m.tipo_operacao || '').toLowerCase();
            const motivo = (m.motivo_saida || m.id_motivo_saida || '').toLowerCase();
            const justificativa = (m.justificativa_detalhe || m.justificativa || '').toLowerCase();
            
            const isSaida = op.includes('saí') || op.includes('sai') || op.includes('perda');
            const isDescarte = motivo.includes('perda') || motivo.includes('descarte') || 
                               justificativa.includes('vencid') || justificativa.includes('avari');
            return isSaida && isDescarte;
          });
          setPerdas(apenasPerdas);
        }

        // CORREÇÃO: Processa Produtos Atualmente Vencidos (Cálculo em Tempo Real)
        if (respostaEstoque?.sucesso && Array.isArray(respostaEstoque.lotes)) {
          // Captura o momento atual e zera as horas para comparar só o dia
          const dataHoje = new Date();
          dataHoje.setHours(0, 0, 0, 0);

          const itensVencidos = respostaEstoque.lotes.filter((lote: any) => {
            // 1. Verifica se o backend já mandou como vencido
            if (lote.status_validade_lote?.toLowerCase().includes('vencido')) return true;

            // 2. Calcula dinamicamente com base na data (Formato: DD/MM/YYYY)
            if (lote.data_validade_lote && lote.data_validade_lote.includes('/')) {
              const [dia, mes, ano] = lote.data_validade_lote.split('/');
              // Converte para padrão ISO aceito pelo Date do JS (YYYY-MM-DD)
              const dataValidade = new Date(`${ano}-${mes}-${dia}T00:00:00`);
              
              // Verifica se a validade já passou
              if (dataValidade < dataHoje) {
                return true;
              }
            }
            return false;
          });
          
          setVencidosPendentes(itensVencidos);
        }

      } catch (erro) {
        Alert.alert('Erro', 'Não foi possível comunicar com os servidores da AWS.');
      } finally {
        setCarregando(false);
      }
    };
    carregarDadosAWS();
  }, []);

  // Gráfico: Balanço de Perdas por Categoria
  const dadosGrafico = useMemo(() => {
    const agregacao: Record<string, number> = {};
    let totalItens = 0;

    perdas.forEach((mov) => {
      const cat = mov.categoria || 'Outros';
      const qtd = parseInt(mov.qtd || mov.quantidade_movimentada_pacote, 10) || 0;
      agregacao[cat] = (agregacao[cat] || 0) + qtd;
      totalItens += qtd;
    });

    const paleta = [theme.danger, tokens.colors.accentAmber500, tokens.colors.neutral600, theme.primary, theme.secondary];

    return Object.keys(agregacao).map((cat, idx) => ({
        label: cat,
        valor: totalItens > 0 ? Math.round((agregacao[cat] / totalItens) * 100) : 0,
        quantidade: agregacao[cat],
        cor: paleta[idx % paleta.length]
    })).sort((a, b) => b.valor - a.valor);
  }, [perdas, theme, tokens]);

  const categoriasDisponiveis = useMemo(() => Array.from(new Set(perdas.map(p => p.categoria || 'Outros').filter(Boolean))), [perdas]);

  // Agrupamento por Produto e Filtragem (Perdas históricas)
  const produtosAgrupadosFiltrados = useMemo(() => {
    const mapaAgrupamento: Record<string, any> = {};
    
    perdas.forEach(mov => {
      const ean = mov.ean || mov.id_produto || mov.id;
      const cat = mov.categoria || 'Outros';
      
      if (!mapaAgrupamento[ean]) {
        mapaAgrupamento[ean] = {
          ean,
          nome: mov.nome || mov.nome_produto,
          categoria: cat,
          volumePerdido: 0,
          historico: []
        };
      }
      mapaAgrupamento[ean].volumePerdido += (parseInt(mov.qtd || mov.quantidade_movimentada_pacote, 10) || 0);
      mapaAgrupamento[ean].historico.push(mov);
    });

    let listaProdutos = Object.values(mapaAgrupamento);

    const termo = termoBusca.toLowerCase().trim();
    if (termo) {
      listaProdutos = listaProdutos.filter(p => p.nome?.toLowerCase().includes(termo) || p.ean?.includes(termo));
    }

    if (categoriasSelecionadas.length > 0) {
      listaProdutos = listaProdutos.filter(p => categoriasSelecionadas.includes(p.categoria));
    }

    listaProdutos.sort((a, b) => {
      let res = 0;
      if (criterioOrdenacao === 'ALFABETICA') res = (a.nome || '').localeCompare(b.nome || '');
      if (criterioOrdenacao === 'VOLUME') res = a.volumePerdido - b.volumePerdido;
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
  }, [perdas, termoBusca, categoriasSelecionadas, criterioOrdenacao, direcaoAscendente]);

  const alternarCategoria = (cat: string) => {
    setCategoriasSelecionadas(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const alternarCriterio = (criterio: CriterioOrdenacao) => {
    if (criterioOrdenacao === criterio) {
      setDirecaoAscendente(!direcaoAscendente);
    } else {
      setCriterioOrdenacao(criterio);
      setDirecaoAscendente(criterio === 'ALFABETICA');
    }
  };

  if (carregando) return <ActivityIndicator size="large" color={theme.danger} style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={[estilosReportsLosses.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsLosses.rolagem} keyboardShouldPersistTaps="handled">
        
        {/* BOTÃO DE VOLTAR */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={estilosReportsLosses.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={[estilosReportsLosses.textoBotaoVoltar, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosReportsLosses.cabecalho}>
          <Text style={[estilosReportsLosses.titulo, { color: theme.danger, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Perdas e Descartes
          </Text>
          <Text style={[estilosReportsLosses.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Auditoria de produtos descartados e alertas de intervenção.
          </Text>
        </View>

        {/* 🚨 AÇÃO REQUERIDA: ITENS VENCIDOS PENDENTES DE DESCARTE NO ESTOQUE 🚨 */}
        {vencidosPendentes.length > 0 && (
          <View style={[estilosReportsLosses.alertaPendenteContainer, { borderColor: theme.danger }]}>
            <View style={estilosReportsLosses.alertaPendenteTituloRow}>
              <Feather name="alert-octagon" size={20} color={theme.danger} style={{ marginRight: 8 }} />
              <Text style={[estilosReportsLosses.alertaPendenteTitulo, { color: theme.danger }]}>
                Ação Requerida: Descartes Pendentes
              </Text>
            </View>
            
            <Text style={[estilosReportsLosses.alertaPendenteTexto, { color: theme.danger }]}>
              O sistema detectou que os itens abaixo estão <Text style={{fontWeight:'bold'}}>vencidos no estoque</Text> e necessitam de descarte imediato.
              {'\n\n'}
              <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }}>Como descartar:</Text> O registro da perda não pode ser realizado por esta tela de relatórios. Para dar baixa oficial, feche este relatório, acesse o menu <Text style={{fontWeight:'bold'}}>Estoque</Text> e utilize a opção <Text style={{fontWeight:'bold'}}>Saída</Text>.
            </Text>

            {vencidosPendentes.map((lote, index) => (
              <View key={lote.id_lote_produto || index} style={[estilosReportsLosses.alertaPendenteItem, { borderTopColor: `${theme.danger}30` }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontWeight: 'bold', color: theme.danger, fontSize: 13 * fontScale }}>{lote.nome_produto}</Text>
                  <Text style={{ fontSize: 11 * fontScale, color: theme.danger, marginTop: 2 }}>
                    Lote: {lote.numero_codigo_lote} • Local: {lote.local_descricao}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '900', color: theme.danger, fontSize: 13 * fontScale }}>
                    {lote.quantidade_atual_pacote} un
                  </Text>
                  <Text style={{ fontSize: 11 * fontScale, color: theme.danger, marginTop: 2 }}>
                    Venceu: {lote.data_validade_lote}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* GRÁFICO FIXO DE BARRAS (Histórico) */}
        <View style={[estilosReportsLosses.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={estilosReportsLosses.tituloSecaoRow}>
            <Text style={[estilosReportsLosses.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale }]}>
              Histórico de Perdas por Categoria
            </Text>
            <TouchableOpacity 
              onPress={() => setMostrarPorcentagem(!mostrarPorcentagem)}
              style={[estilosReportsLosses.btnToggleMetrica, { backgroundColor: `${theme.danger}15` }]}
            >
              <Feather name="refresh-ccw" size={12} color={theme.danger} />
              <Text style={[estilosReportsLosses.btnToggleTexto, { color: theme.danger }]}>
                {mostrarPorcentagem ? 'Ver Volume' : 'Ver Porcentagem'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={estilosReportsLosses.barraContainer}>
            {dadosGrafico.length === 0 && <Text style={{ color: theme.subtext }}>Sem registro de perdas anteriores.</Text>}
            {dadosGrafico.map(item => (
              <View key={item.label} style={estilosReportsLosses.linhaBarra}>
                <View style={estilosReportsLosses.rotuloBarraRow}>
                  <Text style={[estilosReportsLosses.rotuloBarraTexto, { color: theme.text, fontSize: 12 * fontScale }]}>{item.label}</Text>
                  <Text style={[estilosReportsLosses.rotuloBarraValor, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                    {mostrarPorcentagem ? `${item.valor}%` : `${item.quantidade} un`}
                  </Text>
                </View>
                <View style={[estilosReportsLosses.trilhoBarra, { backgroundColor: theme.border }]}>
                  <View style={[estilosReportsLosses.preenchimentoBarra, { width: `${item.valor}%`, backgroundColor: item.cor }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FILTROS AVANÇADOS */}
        <View style={estilosReportsLosses.searchBarRow}>
          <View style={[estilosReportsLosses.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Buscar produto descartado (histórico)..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[estilosReportsLosses.searchInput, { color: theme.text, fontSize: 13 * fontScale }]}
            />
          </View>
          <TouchableOpacity
            onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
            style={[estilosReportsLosses.btnBuscaAvancada, { backgroundColor: buscaAvancadaAberta ? `${theme.danger}15` : theme.surface, borderColor: buscaAvancadaAberta ? theme.danger : theme.border }]}
          >
            <Feather name="sliders" size={18} color={buscaAvancadaAberta ? theme.danger : '#475569'} />
          </TouchableOpacity>
        </View>

        {buscaAvancadaAberta && (
          <View style={[estilosReportsLosses.gavetaFiltros, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[estilosReportsLosses.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>Filtrar Categorias:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilosReportsLosses.scrollCategoriasContainer}>
              {categoriasDisponiveis.map(cat => {
                const ativo = categoriasSelecionadas.includes(cat);
                return (
                  <TouchableOpacity 
                    key={cat} onPress={() => alternarCategoria(cat)}
                    style={[estilosReportsLosses.chipFiltro, { backgroundColor: ativo ? theme.danger : theme.background, borderColor: ativo ? theme.danger : theme.border }]}
                  >
                    <Text style={{ color: ativo ? '#FFF' : theme.text, fontSize: 11 * fontScale }}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[estilosReportsLosses.labelSecaoFiltro, { color: theme.text, fontSize: 12 * fontScale, marginTop: 12 }]}>Ordenar Agrupamentos:</Text>
            <View style={estilosReportsLosses.botoesWrapRow}>
              <TouchableOpacity onPress={() => alternarCriterio('DATA')} style={[estilosReportsLosses.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'DATA' ? theme.danger : theme.surface, borderColor: criterioOrdenacao === 'DATA' ? theme.danger : theme.border }]}>
                <Feather name="clock" size={14} color={criterioOrdenacao === 'DATA' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'DATA' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Data {criterioOrdenacao === 'DATA' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alternarCriterio('VOLUME')} style={[estilosReportsLosses.chipOrdenacaoFixo, { backgroundColor: criterioOrdenacao === 'VOLUME' ? theme.danger : theme.surface, borderColor: criterioOrdenacao === 'VOLUME' ? theme.danger : theme.border }]}>
                <Feather name="layers" size={14} color={criterioOrdenacao === 'VOLUME' ? '#FFF' : theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: criterioOrdenacao === 'VOLUME' ? '#FFF' : theme.text, fontSize: 11 * fontScale, fontWeight: '600' }}>Volume {criterioOrdenacao === 'VOLUME' ? (direcaoAscendente ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LISTAGEM CONTÍNUA MINIMALISTA AGRUPADA POR PRODUTO */}
        {produtosAgrupadosFiltrados.length > 0 ? (
          <View style={[estilosReportsLosses.tabelaContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {produtosAgrupadosFiltrados.map((produto, idx) => (
              <View 
                key={produto.ean || idx} 
                style={{ 
                  borderBottomWidth: idx === produtosAgrupadosFiltrados.length - 1 ? 0 : 4, 
                  borderBottomColor: theme.background 
                }}
              >
                {/* AGRUPADOR DO PRODUTO */}
                <View style={estilosReportsLosses.produtoHeaderMinimalista}>
                  <View style={estilosReportsLosses.produtoNomeRow}>
                    <Text style={[estilosReportsLosses.produtoNome, { color: theme.text, fontSize: 14 * fontScale }]} numberOfLines={1}>
                      {produto.nome}
                    </Text>
                  </View>
                  <Text style={[estilosReportsLosses.produtoSub, { color: theme.subtext }]}>
                    EAN: {produto.ean} • Total Perdido: <Text style={{ color: theme.danger, fontWeight: 'bold' }}>{produto.volumePerdido} un</Text>
                  </Text>
                </View>

                {/* HISTÓRICO DE DESCARTES */}
                {produto.historico.map((mov: any, i: number) => {
                  const motivoSaida = mov.motivo_saida || mov.nome_motivo_saida || 'Descarte';
                  const dataMov = mov.data || mov.data_hora_movimentacao || '';
                  const justificativa = mov.justificativa_detalhe || mov.justificativa || 'Sem justificativa informada';
                  const qtdMov = mov.qtd || mov.quantidade_movimentada_pacote || 0;
                  const respMov = mov.responsavel || mov.id_usuario_responsavel || 'Usuário';

                  return (
                    <View 
                      key={mov.id || mov.id_movimentacao_estoque || i} 
                      style={[
                        estilosReportsLosses.perdaContainer, 
                        { borderBottomColor: theme.border, borderBottomWidth: i === produto.historico.length - 1 ? 0 : 1 }
                      ]}
                    >
                      <View style={estilosReportsLosses.linhaMotivoData}>
                        <Text style={[estilosReportsLosses.textoMotivo, { color: theme.danger }]}>
                          {motivoSaida}
                        </Text>
                        <Text style={[estilosReportsLosses.textoDataHora, { color: theme.subtext }]}>
                          {dataMov.split('T')[0]}
                        </Text>
                      </View>
                      
                      <View style={estilosReportsLosses.linhaJustificativa}>
                        <Text style={[estilosReportsLosses.textoJustificativa, { color: theme.text }]} numberOfLines={3}>
                          "{justificativa}"
                        </Text>
                      </View>

                      <View style={estilosReportsLosses.linhaResponsavelQtd}>
                        <Text style={[estilosReportsLosses.textoDetalhes, { color: theme.subtext }]}>
                          Resp: <Text style={{ color: theme.text, fontWeight: '700' }}>{respMov}</Text>
                        </Text>
                        <Text style={[estilosReportsLosses.textoDetalhes, { color: theme.danger, fontWeight: 'bold' }]}>
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
            Nenhum registro de perda corresponde aos filtros aplicados.
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}