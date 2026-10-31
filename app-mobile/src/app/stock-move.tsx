// src/app/stock-move.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosStockMove } from '../styles/stock-move.styles';
import { requisicaoApi } from '../services/api';
import { auth } from '../services/firebaseConfig';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';

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

export default function StockMoveScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [lotesRaw, setLotesRaw] = useState<LoteItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);
  const [modalLotesVisivel, setModalLotesVisivel] = useState(false);
  
  const [loteSelecionado, setLoteSelecionado] = useState<LoteItem | null>(null);
  const [modalMoverVisivel, setModalMoverVisivel] = useState(false);
  
  // Modais customizados que substituem os Alerts nativos
  const [modalPerguntaDivisao, setModalPerguntaDivisao] = useState(false);
  const [modalAvisoGenerico, setModalAvisoGenerico] = useState<{ visivel: boolean, titulo: string, mensagem: string }>({ visivel: false, titulo: '', mensagem: '' });
  
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [resumoMove, setResumoMove] = useState<{qtd: number, localDestino: string, localOrigem: string, loteRestante: number} | null>(null);

  const [quantidadeMover, setQuantidadeMover] = useState('');
  const [novoLocal, setNovoLocal] = useState('');
  const [processando, setProcessando] = useState(false);

  const locaisArmazenamento = [
    'Armário A - Prateleira 1',
    'Armário A - Prateleira 2',
    'Armário B - Prateleira 1',
    'Despensa Prateleira 1',
    'Geladeira 1 - Gaveta Superior',
  ];

  const converterDataParaMs = (dataStr: string) => {
    if (!dataStr) return 9999999999999;
    if (dataStr.includes('/')) {
      const [d, m, y] = dataStr.split('/');
      return new Date(`${y}-${m}-${d}T00:00:00`).getTime();
    }
    return new Date(`${dataStr}T00:00:00`).getTime();
  };

  const carregarEstoque = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        const lotesProcessados = resposta.lotes
          .filter((l: any) => Number(l.quantidade_atual_pacote) > 0)
          .map((l: any) => ({
            ...l,
            data_ms: converterDataParaMs(l.data_validade_lote)
          }));
        setLotesRaw(lotesProcessados);
      } else {
        setLotesRaw([]);
      }
    } catch (erro) {
      setModalAvisoGenerico({ visivel: true, titulo: 'Erro', mensagem: 'Não foi possível carregar os itens do estoque da AWS.' });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstoque();
  }, [carregarEstoque]);

  const produtosFiltrados = useMemo(() => {
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
      prod.quantidade_total += Number(lote.quantidade_atual_pacote) || 0;
      prod.lotes.push(lote);
    });

    let lista = Array.from(mapa.values());
    lista.forEach(p => p.lotes.sort((a, b) => a.data_ms - b.data_ms));

    const termo = termoBusca.toLowerCase().trim();
    if (termo) {
      lista = lista.filter(
        (p) =>
          p.nome_produto.toLowerCase().includes(termo) ||
          p.codigo_barra_produto.includes(termo) ||
          p.categoria.toLowerCase().includes(termo)
      );
    }

    return lista.sort((a, b) => a.nome_produto.localeCompare(b.nome_produto));
  }, [lotesRaw, termoBusca]);

  const obterPlaceholder = (cat: string) => {
    const c = (cat || '').toLowerCase();
    try {
      if (c.includes('lati') || c.includes('leite')) return require('../../assets/images/placeholder_laticinios.png');
      if (c.includes('grão') || c.includes('arroz') || c.includes('feij')) return require('../../assets/images/placeholder_graos.png');
      if (c.includes('massa') || c.includes('macarr')) return require('../../assets/images/placeholder_massas.png');
      if (c.includes('óleo') || c.includes('oleo') || c.includes('gordura')) return require('../../assets/images/placeholder_oleos.png');
      return require('../../assets/images/placeholder_geral.png');
    } catch {
      return require('../../assets/images/placeholder_geral.png');
    }
  };

  const abrirFormularioMover = (lote: LoteItem) => {
    setLoteSelecionado(lote);
    setQuantidadeMover(String(lote.quantidade_atual_pacote)); 
    setNovoLocal('');
    setModalLotesVisivel(false);
    setModalMoverVisivel(true);
  };

  const qtdNumerica = Number(quantidadeMover);
  const vaiDividirLote = loteSelecionado && qtdNumerica > 0 && qtdNumerica < loteSelecionado.quantidade_atual_pacote;

  const confirmarMover = () => {
    if (!loteSelecionado) return;

    if (!quantidadeMover || isNaN(qtdNumerica) || qtdNumerica <= 0) {
      setModalAvisoGenerico({ visivel: true, titulo: 'Quantidade Inválida', mensagem: 'Informe uma quantidade válida para transferir.' });
      return;
    }

    if (qtdNumerica > loteSelecionado.quantidade_atual_pacote) {
      setModalAvisoGenerico({ visivel: true, titulo: 'Saldo Insuficiente', mensagem: `Este lote possui apenas ${loteSelecionado.quantidade_atual_pacote} pacotes neste local.` });
      return;
    }

    if (!novoLocal) {
      setModalAvisoGenerico({ visivel: true, titulo: 'Destino Obrigatório', mensagem: 'Selecione o novo local onde o produto será guardado.' });
      return;
    }

    if (novoLocal === loteSelecionado.local_descricao) {
      setModalAvisoGenerico({ visivel: true, titulo: 'Mesmo Local', mensagem: 'O destino deve ser diferente do local atual.' });
      return;
    }

    if (vaiDividirLote) {
      setModalPerguntaDivisao(true);
    } else {
      dispararRequisicaoApi();
    }
  };

  const dispararRequisicaoApi = async () => {
    setModalPerguntaDivisao(false);
    setProcessando(true);
    
    try {
      const localOrigemOriginal = loteSelecionado?.local_descricao || '';
      const quantidadeRestanteNaOrigem = (loteSelecionado?.quantidade_atual_pacote || 0) - qtdNumerica;

      // 1º Remove o saldo do local atual na AWS
      const respSaida: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'saida_produto',
          id_lote_produto: loteSelecionado?.id_lote_produto,
          lote: loteSelecionado,
          quantidade: qtdNumerica,
          motivo_saida: 'saída - movimentação estoque',
          justificativa: `Transferido para: ${novoLocal}`,
          id_usuario: auth.currentUser?.email || 'operador',
        },
      });

      if (!respSaida?.sucesso) {
        throw new Error(respSaida?.mensagem || 'Falha ao remover do local de origem.');
      }

      // 2º Cria o lote no local de destino com um novo ID exclusivo
      const idExclusivoNovoLote = `lote_mov_${Date.now().toString(36)}`;
      
      const loteParaEntrada = {
        ...loteSelecionado,
        id_lote_produto: idExclusivoNovoLote,
        local_descricao: novoLocal,
        quantidade_inicial_pacote: qtdNumerica,
        quantidade_atual_pacote: qtdNumerica,
        id_usuario: auth.currentUser?.email || 'operador',
      };

      const respEntrada: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'cadastrar_lote',
          lote: loteParaEntrada,
        },
      });

      if (!respEntrada?.sucesso) {
        throw new Error(respEntrada?.mensagem || 'Falha ao registrar no novo local.');
      }

      setResumoMove({ 
        qtd: qtdNumerica, 
        localDestino: novoLocal,
        localOrigem: localOrigemOriginal,
        loteRestante: quantidadeRestanteNaOrigem
      });
      setModalMoverVisivel(false);
      setModalSucessoVisivel(true);

    } catch (erro: any) {
      setModalAvisoGenerico({ visivel: true, titulo: 'Erro na Transferência', mensagem: erro.message || 'Falha de comunicação.' });
    } finally {
      setProcessando(false);
    }
  };

  const concluirEFecharTudo = async () => {
    setModalSucessoVisivel(false);
    setResumoMove(null);
    setProdutoSelecionado(null);
    setLoteSelecionado(null);
    await carregarEstoque(); 
  };

  return (
    <SafeAreaView style={[estilosStockMove.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockMove.rolagem} keyboardShouldPersistTaps="handled">
        
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={estilosStockMove.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={[estilosStockMove.textoBotaoVoltar, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosStockMove.cabecalho}>
          <Text style={[estilosStockMove.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Mover Produtos de Local
          </Text>
          <Text style={[estilosStockMove.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Transfira os itens entre armários e geladeiras mantendo a rastreabilidade intacta.
          </Text>
        </View>

        <View style={estilosStockMove.searchBarRow}>
          <View style={[estilosStockMove.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Buscar item que deseja mover..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[estilosStockMove.searchInput, { color: theme.text, fontSize: 13 * fontScale }]}
            />
            {termoBusca.length > 0 && (
              <TouchableOpacity onPress={() => setTermoBusca('')}>
                <Feather name="x-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : produtosFiltrados.length === 0 ? (
          <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>
            Nenhum produto localizado no estoque.
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {produtosFiltrados.map((item) => (
              <TouchableOpacity
                key={item.codigo_barra_produto}
                onPress={() => {
                  setProdutoSelecionado(item);
                  setModalLotesVisivel(true);
                }}
                activeOpacity={0.8}
                style={[
                  estilosStockMove.listaCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Image
                  source={item.foto_url ? { uri: item.foto_url } : obterPlaceholder(item.categoria)}
                  style={estilosStockMove.listaFoto}
                  resizeMode="cover"
                />

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={[estilosStockMove.produtoNome, { color: theme.text, fontSize: 13 * fontScale }]} numberOfLines={1}>
                    {item.nome_produto}
                  </Text>
                  <Text style={[estilosStockMove.produtoMeta, { color: theme.subtext, fontSize: 10.5 * fontScale }]} numberOfLines={1}>
                    {item.categoria} • EAN: {item.codigo_barra_produto}
                  </Text>
                  <Text style={[estilosStockMove.produtoSub, { color: theme.primary, fontSize: 10 * fontScale }]}>
                    Toque para mover
                  </Text>
                </View>

                <View style={[estilosStockMove.badgeQtdConsolidada, { borderColor: theme.border }]}>
                  <Text style={[estilosStockMove.badgeQtdNumero, { color: theme.primary, fontSize: 12.5 * fontScale }]}>
                    {item.quantidade_total}
                  </Text>
                  <Text style={[estilosStockMove.badgeQtdRotulo, { color: theme.primary, fontSize: 8.5 * fontScale }]}>
                    pcts
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal 1: Seleção de Lote */}
      <Modal
        visible={modalLotesVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLotesVisivel(false)}
      >
        <View style={estilosStockMove.modalOverlay}>
          <View style={[estilosStockMove.modalCard, { backgroundColor: theme.surface }]}>
            
            <View style={estilosStockMove.modalCapaContainer}>
              <TouchableOpacity
                onPress={() => setModalLotesVisivel(false)}
                style={estilosStockMove.modalCloseBtnAbsolute}
              >
                <Feather name="x" size={18} color="#000000" />
              </TouchableOpacity>
              
              <Image
                source={produtoSelecionado?.foto_url ? { uri: produtoSelecionado.foto_url } : obterPlaceholder(produtoSelecionado?.categoria || '')}
                style={estilosStockMove.modalProdutoFotoCapa}
                resizeMode="cover"
              />
            </View>

            <View style={estilosStockMove.modalConteudoBox}>
              <Text style={[estilosStockMove.modalProdutoNomeCenter, { color: theme.primary, fontSize: 16 * fontScale }]} numberOfLines={2}>
                {produtoSelecionado?.nome_produto}
              </Text>

              <Text style={[estilosStockMove.modalLotesTitulo, { color: theme.text, fontSize: 13 * fontScale, marginTop: 12 }]}>
                Qual lote deseja mover de local?
              </Text>

              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {produtoSelecionado?.lotes.map((lote) => {
                  return (
                    <TouchableOpacity
                      key={lote.id_lote_produto}
                      onPress={() => abrirFormularioMover(lote)}
                      activeOpacity={0.7}
                      style={[
                        estilosStockMove.loteCardItem,
                        { backgroundColor: '#F8FAFC', borderColor: theme.border },
                      ]}
                    >
                      <View style={estilosStockMove.loteLinhaTopo}>
                        <Text style={[estilosStockMove.loteCodigo, { color: theme.text, fontSize: 11.5 * fontScale }]}>
                          Lote: {lote.numero_codigo_lote}
                        </Text>
                        <Text style={[estilosStockMove.loteQtd, { color: theme.primary, fontSize: 11.5 * fontScale }]}>
                          {lote.quantidade_atual_pacote} pacotes
                        </Text>
                      </View>

                      <Text style={[estilosStockMove.loteLocal, { color: theme.subtext, fontSize: 10.5 * fontScale }]}>
                        Atual: {lote.local_descricao}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Formulário de Transferência */}
      <Modal
        visible={modalMoverVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalMoverVisivel(false)}
      >
        <View style={estilosStockMove.modalOverlay}>
          <View style={[estilosStockMove.modalCard, { backgroundColor: theme.surface }]}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 12, paddingHorizontal: 16 }}>
              <Text style={{ fontWeight: '900', color: theme.primary, fontSize: 16 * fontScale }}>Mover Lote</Text>
              <TouchableOpacity onPress={() => setModalMoverVisivel(false)}>
                <Feather name="x" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              
              <View style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontWeight: 'bold', color: theme.text }}>{loteSelecionado?.nome_produto}</Text>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>Lote: {loteSelecionado?.numero_codigo_lote} • Local: {loteSelecionado?.local_descricao}</Text>
              </View>

              <AppInput
                rotulo={`Quantos pacotes mover? (Total: ${loteSelecionado?.quantidade_atual_pacote})`}
                placeholder="0"
                keyboardType="numeric"
                value={quantidadeMover}
                onChangeText={setQuantidadeMover}
              />

              {vaiDividirLote ? (
                <View style={[estilosStockMove.avisoDivisaoLote, { backgroundColor: `${tokens.colors.accentAmber500}15`, borderColor: tokens.colors.accentAmber500 }]}>
                  <Feather name="alert-triangle" size={20} color={tokens.colors.accentAmber500} />
                  <Text style={[estilosStockMove.textoAvisoDivisao, { color: theme.text }]}>
                    Como a quantidade ({quantidadeMover}) é menor que o total ({loteSelecionado?.quantidade_atual_pacote}), este lote será DIVIDIDO em dois locais físicos.
                  </Text>
                </View>
              ) : null}

              <Text style={[{ fontWeight: 'bold', color: theme.text, marginTop: 8, marginBottom: 8 }]}>
                Para qual local ele vai?
              </Text>

              <View style={estilosStockMove.gradeLocais}>
                {locaisArmazenamento.map((loc) => {
                  const selecionado = novoLocal === loc;
                  const ehLocalAtual = loc === loteSelecionado?.local_descricao;

                  return (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => setNovoLocal(loc)}
                      style={[
                        estilosStockMove.botaoLocal,
                        {
                          backgroundColor: selecionado ? `${theme.primary}15` : theme.background,
                          borderColor: selecionado ? theme.primary : theme.border,
                          opacity: ehLocalAtual ? 0.4 : 1,
                        },
                      ]}
                    >
                      <Text style={[estilosStockMove.textoBotaoLocal, { color: selecionado ? theme.primary : theme.text }]}>
                        {loc} {ehLocalAtual ? '(Atual)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 8, marginBottom: 20 }}>
                <AppButton
                  title={vaiDividirLote ? 'Transferir e Dividir Lote' : 'Confirmar Transferência'}
                  variant="primary"
                  onPress={confirmarMover}
                />
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 3: FEEDBACK DE SUCESSO DETALHADO */}
      <Modal
        visible={modalSucessoVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={concluirEFecharTudo}
      >
        <View style={estilosStockMove.modalOverlay}>
          <View style={[estilosStockMove.modalCard, { backgroundColor: theme.surface, padding: 24 }]}>
            
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Feather name="refresh-cw" size={28} color="#0284C7" />
              </View>
              <Text style={{ fontSize: 18 * fontScale, fontWeight: '900', color: theme.text }}>Transferência Realizada!</Text>
              <Text style={{ fontSize: 13 * fontScale, color: theme.subtext, textAlign: 'center', marginTop: 4 }}>
                A movimentação interna foi auditada com sucesso na AWS.
              </Text>
            </View>

            {resumoMove && (
              <View style={{ backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 20 }}>
                
                <Text style={{ color: theme.primary, fontWeight: 'bold', marginBottom: 8 }}>Resumo da Movimentação:</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: theme.danger, fontWeight: '600', flex: 1 }}>↓ Saiu de ({resumoMove.localOrigem}):</Text>
                  <Text style={{ color: theme.danger, fontWeight: '900' }}>{resumoMove.qtd} pcts</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <Text style={{ color: '#10B981', fontWeight: '600', flex: 1 }}>↑ Entrou em ({resumoMove.localDestino}):</Text>
                  <Text style={{ color: '#10B981', fontWeight: '900' }}>{resumoMove.qtd} pcts</Text>
                </View>

                {resumoMove.loteRestante > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.subtext, fontWeight: '500', flex: 1 }}>Restou em ({resumoMove.localOrigem}):</Text>
                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>{resumoMove.loteRestante} pcts</Text>
                  </View>
                )}

              </View>
            )}

            <AppButton
              title="Ok, Concluir"
              variant="primary"
              onPress={concluirEFecharTudo}
            />

          </View>
        </View>
      </Modal>

      {/* Modal 4: PERGUNTA DIVISÃO (Substitui Alert padrão) */}
      <Modal
        visible={modalPerguntaDivisao}
        transparent={true}
        animationType="fade"
      >
        <View style={estilosStockMove.modalOverlay}>
          <View style={[estilosStockMove.modalCard, { backgroundColor: theme.surface, padding: 24 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Feather name="alert-triangle" size={24} color="#D97706" />
              </View>
              <Text style={{ fontSize: 16 * fontScale, fontWeight: '900', color: theme.text, textAlign: 'center' }}>Confirmar Divisão do Lote?</Text>
            </View>
            <Text style={{ fontSize: 13 * fontScale, color: theme.text, textAlign: 'center', marginBottom: 20 }}>
              Você está movendo <Text style={{fontWeight: 'bold'}}>{quantidadeMover}</Text> pacotes de um total de <Text style={{fontWeight: 'bold'}}>{loteSelecionado?.quantidade_atual_pacote}</Text>. Isso dividirá o lote físico em dois compartimentos distintos. Confirma a operação?
            </Text>
            
            {processando ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <View style={{ flexDirection: 'column', gap: 10 }}>
                <AppButton
                  title="Sim, Dividir e Transferir"
                  variant="primary"
                  onPress={dispararRequisicaoApi}
                />
                <TouchableOpacity 
                  onPress={() => setModalPerguntaDivisao(false)}
                  style={{ padding: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: theme.subtext, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal 5: AVISOS GENÉRICOS (Substitui Alert padrão) */}
      <Modal
        visible={modalAvisoGenerico.visivel}
        transparent={true}
        animationType="fade"
      >
        <View style={estilosStockMove.modalOverlay}>
          <View style={[estilosStockMove.modalCard, { backgroundColor: theme.surface, padding: 24 }]}>
            <Text style={{ fontSize: 16 * fontScale, fontWeight: '900', color: theme.text, marginBottom: 8 }}>{modalAvisoGenerico.titulo}</Text>
            <Text style={{ fontSize: 13 * fontScale, color: theme.subtext, marginBottom: 20 }}>{modalAvisoGenerico.mensagem}</Text>
            <AppButton
              title="Ok"
              variant="secondary"
              onPress={() => setModalAvisoGenerico({ visivel: false, titulo: '', mensagem: '' })}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}