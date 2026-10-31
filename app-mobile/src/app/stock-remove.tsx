// src/app/stock-remove.tsx
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosStockRemove } from '../styles/stock-remove.styles';
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

export default function StockRemoveScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [lotesRaw, setLotesRaw] = useState<LoteItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  // Modais e Seleções
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);
  const [modalLotesVisivel, setModalLotesVisivel] = useState(false);
  
  const [loteSelecionado, setLoteSelecionado] = useState<LoteItem | null>(null);
  const [modalSaidaVisivel, setModalSaidaVisivel] = useState(false);
  
  // Modal de Sucesso Visual
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [resumoBaixa, setResumoBaixa] = useState<{qtd: number, saldoNovo: number, motivo: string} | null>(null);

  // Estados do Formulário
  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  const [motivoSaida, setMotivoSaida] = useState('saída para consumo');
  const [justificativa, setJustificativa] = useState('');
  const [palavraTravaPerda, setPalavraTravaPerda] = useState('');
  const [processandoBaixa, setProcessandoBaixa] = useState(false);

  const motivosDisponiveis = [
    'saída para consumo',
    'perda - descarte vencido',
    'perda - descarte',
    'saída - outro motivo',
  ];

  // Converte data para timestamp para a rigorosa ordenação FEFO
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
        // FILTRO CRÍTICO: Exibe apenas lotes que possuem saldo > 0.
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
      Alert.alert('Erro', 'Não foi possível carregar os itens do estoque da AWS.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstoque();
  }, [carregarEstoque]);

  // Agrupa os produtos e ordena FEFO internamente
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

    // FEFO: Ordena os lotes dentro de cada produto pela data de vencimento
    lista.forEach(p => {
      p.lotes.sort((a, b) => a.data_ms - b.data_ms);
    });

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

  const handleSelecionarLote = (lote: LoteItem) => {
    if (!produtoSelecionado) return;
    
    // O array está ordenado FEFO, então o índice 0 é sempre o mais urgente
    const loteMaisProximo = produtoSelecionado.lotes[0];
    
    if (lote.id_lote_produto !== loteMaisProximo.id_lote_produto && lote.data_ms > loteMaisProximo.data_ms) {
      Alert.alert(
        'Atenção à Validade (FEFO)',
        `Existe um lote com vencimento mais próximo (${loteMaisProximo.data_validade_lote}) e deve ser priorizado.\n\nDeseja mesmo retirar o lote selecionado?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => abrirFormularioSaida(lote) }
        ]
      );
    } else {
      abrirFormularioSaida(lote);
    }
  };

  const abrirFormularioSaida = (lote: LoteItem) => {
    setLoteSelecionado(lote);
    setQuantidadeSaida('');
    setMotivoSaida('saída para consumo');
    setJustificativa('');
    setPalavraTravaPerda('');
    setModalLotesVisivel(false);
    setModalSaidaVisivel(true);
  };

  const confirmarBaixa = async () => {
    if (!loteSelecionado) return;

    const qtd = Number(quantidadeSaida);

    if (!quantidadeSaida || isNaN(qtd) || qtd <= 0) {
      Alert.alert('Quantidade Inválida', 'Informe quantos pacotes deseja retirar.');
      return;
    }

    if (qtd > loteSelecionado.quantidade_atual_pacote) {
      Alert.alert(
        'Saldo Insuficiente',
        `Você tentou retirar ${qtd} unidades, mas o lote possui apenas ${loteSelecionado.quantidade_atual_pacote}. O estoque não pode ficar negativo.`
      );
      return;
    }

    const ehDescarte = motivoSaida.toLowerCase().includes('perda');
    if (ehDescarte) {
      if (palavraTravaPerda.trim() !== 'PERDA') {
        Alert.alert('Trava de Segurança', 'Digite a palavra "PERDA" em letras maiúsculas para autorizar o descarte.');
        return;
      }
      if (!justificativa.trim()) {
        Alert.alert('Justificativa', 'Por favor, descreva o motivo do descarte para o relatório.');
        return;
      }
    }

    setProcessandoBaixa(true);
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'saida_produto',
          lote: loteSelecionado,
          quantidade: qtd,
          motivo_saida: motivoSaida,
          palavra_confirmacao: palavraTravaPerda,
          justificativa: justificativa,
          id_usuario: auth.currentUser?.email || 'operador',
        },
      });

      if (resposta?.sucesso) {
        setResumoBaixa({ qtd: qtd, saldoNovo: resposta.novo_saldo, motivo: motivoSaida });
        setModalSaidaVisivel(false);
        setModalSucessoVisivel(true); 
      } else {
        Alert.alert('Falha', resposta?.mensagem || 'Não foi possível registrar a baixa na AWS.');
      }
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Falha de comunicação.');
    } finally {
      setProcessandoBaixa(false);
    }
  };

  const concluirEFecharTudo = async () => {
    setModalSucessoVisivel(false);
    setResumoBaixa(null);
    setProdutoSelecionado(null);
    setLoteSelecionado(null);
    await carregarEstoque(); 
  };

  return (
    <SafeAreaView style={[estilosStockRemove.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockRemove.rolagem} keyboardShouldPersistTaps="handled">
        
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={estilosStockRemove.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.danger} />
          <Text style={[estilosStockRemove.textoBotaoVoltar, { color: theme.danger, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosStockRemove.cabecalho}>
          <Text style={[estilosStockRemove.titulo, { color: theme.danger, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Saída de Produtos
          </Text>
          <Text style={[estilosStockRemove.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Selecione o item no estoque para dar baixa. Lotes próximos do vencimento devem ser priorizados.
          </Text>
        </View>

        <View style={estilosStockRemove.searchBarRow}>
          <View style={[estilosStockRemove.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Buscar item no estoque..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[estilosStockRemove.searchInput, { color: theme.text, fontSize: 13 * fontScale }]}
            />
            {termoBusca.length > 0 && (
              <TouchableOpacity onPress={() => setTermoBusca('')}>
                <Feather name="x-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.danger} style={{ marginTop: 40 }} />
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
                  estilosStockRemove.listaCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Image
                  source={item.foto_url ? { uri: item.foto_url } : obterPlaceholderPorCategoria(item.categoria)}
                  style={estilosStockRemove.listaFoto}
                  resizeMode="cover"
                />

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={[estilosStockRemove.produtoNome, { color: theme.text, fontSize: 13 * fontScale }]} numberOfLines={1}>
                    {item.nome_produto}
                  </Text>
                  <Text style={[estilosStockRemove.produtoMeta, { color: theme.subtext, fontSize: 10.5 * fontScale }]} numberOfLines={1}>
                    {item.categoria} • EAN: {item.codigo_barra_produto}
                  </Text>
                  <Text style={[estilosStockRemove.produtoSub, { color: theme.danger, fontSize: 10 * fontScale }]}>
                    Toque para remover
                  </Text>
                </View>

                <View style={[estilosStockRemove.badgeQtdConsolidada, { borderColor: theme.border }]}>
                  <Text style={[estilosStockRemove.badgeQtdNumero, { color: theme.primary, fontSize: 12.5 * fontScale }]}>
                    {item.quantidade_total}
                  </Text>
                  <Text style={[estilosStockRemove.badgeQtdRotulo, { color: theme.primary, fontSize: 8.5 * fontScale }]}>
                    pcts
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal 1: Lista de Lotes (FEFO) - CAPA FULL WIDTH */}
      <Modal
        visible={modalLotesVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLotesVisivel(false)}
      >
        <View style={estilosStockRemove.modalOverlay}>
          <View style={estilosStockRemove.modalCard}>
            
            <View style={estilosStockRemove.modalCapaContainer}>
              <TouchableOpacity
                onPress={() => setModalLotesVisivel(false)}
                style={estilosStockRemove.modalCloseBtnAbsolute}
              >
                <Feather name="x" size={18} color="#000000" />
              </TouchableOpacity>
              
              <Image
                source={produtoSelecionado?.foto_url ? { uri: produtoSelecionado.foto_url } : obterPlaceholderPorCategoria(produtoSelecionado?.categoria || '')}
                style={estilosStockRemove.modalProdutoFotoCapa}
                resizeMode="cover"
              />
            </View>

            <View style={estilosStockRemove.modalConteudoBox}>
              <Text style={[estilosStockRemove.modalProdutoNomeCenter, { color: theme.danger, fontSize: 16 * fontScale }]} numberOfLines={2}>
                {produtoSelecionado?.nome_produto}
              </Text>
              <Text style={[estilosStockRemove.modalProdutoMetaCenter, { color: theme.subtext, fontSize: 11.5 * fontScale }]}>
                {produtoSelecionado?.categoria} • EAN: {produtoSelecionado?.codigo_barra_produto}
              </Text>

              <Text style={[estilosStockRemove.modalLotesTitulo, { color: theme.text, fontSize: 12.5 * fontScale }]}>
                Selecione o Lote para dar baixa:
              </Text>

              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {produtoSelecionado?.lotes.map((lote, index) => {
                  const isMaisUrgente = index === 0;

                  return (
                    <TouchableOpacity
                      key={lote.id_lote_produto}
                      onPress={() => handleSelecionarLote(lote)}
                      activeOpacity={0.7}
                      style={[
                        estilosStockRemove.loteCardItem,
                        {
                          backgroundColor: isMaisUrgente ? '#FFFBEB' : '#F8FAFC',
                          borderColor: isMaisUrgente ? tokens.colors.accentAmber500 : theme.border,
                        },
                      ]}
                    >
                      <View style={estilosStockRemove.loteLinhaTopo}>
                        <Text style={[estilosStockRemove.loteCodigo, { color: theme.text, fontSize: 11.5 * fontScale }]}>
                          Lote: {lote.numero_codigo_lote}
                        </Text>
                        <Text style={[estilosStockRemove.loteQtd, { color: theme.primary, fontSize: 11.5 * fontScale }]}>
                          {lote.quantidade_atual_pacote} pcts
                        </Text>
                      </View>

                      <Text style={[estilosStockRemove.loteLocal, { color: theme.subtext, fontSize: 10.5 * fontScale }]}>
                        Local: {lote.local_descricao}
                      </Text>

                      <View style={estilosStockRemove.loteValidadeBox}>
                        <Feather name="calendar" size={14} color={tokens.colors.accentAmber500} />
                        <Text style={[estilosStockRemove.loteValidadeTexto, { color: tokens.colors.accentAmber500, fontSize: 10.5 * fontScale }]}>
                          Validade: {lote.data_validade_lote} {isMaisUrgente ? '(Prioridade)' : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

          </View>
        </View>
      </Modal>

      {/* Modal 2: Formulário de Saída */}
      <Modal
        visible={modalSaidaVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalSaidaVisivel(false)}
      >
        <View style={estilosStockRemove.modalOverlay}>
          <View style={[estilosStockRemove.modalCard, { backgroundColor: theme.surface, padding: 24 }]}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontWeight: '900', color: theme.danger, fontSize: 16 * fontScale }}>Confirmar Retirada</Text>
              <TouchableOpacity onPress={() => setModalSaidaVisivel(false)}>
                <Feather name="x" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <View style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontWeight: 'bold', color: theme.text }}>{loteSelecionado?.nome_produto}</Text>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>Lote: {loteSelecionado?.numero_codigo_lote} • Local: {loteSelecionado?.local_descricao}</Text>
              </View>

              <AppInput
                rotulo={`Quantidade (Máximo: ${loteSelecionado?.quantidade_atual_pacote})`}
                placeholder="0"
                keyboardType="numeric"
                value={quantidadeSaida}
                onChangeText={setQuantidadeSaida}
              />

              <Text style={[estilosStockRemove.labelForm, { color: theme.text, fontSize: 12 * fontScale }]}>
                Motivo da Saída:
              </Text>
              <View style={estilosStockRemove.gradeMotivos}>
                {motivosDisponiveis.map((mot) => (
                  <TouchableOpacity
                    key={mot}
                    onPress={() => setMotivoSaida(mot)}
                    style={[
                      estilosStockRemove.botaoMotivo,
                      {
                        backgroundColor: motivoSaida === mot ? `${theme.danger}15` : theme.background,
                        borderColor: motivoSaida === mot ? theme.danger : theme.border,
                      },
                    ]}
                  >
                    <Text style={[estilosStockRemove.textoMotivo, { color: motivoSaida === mot ? theme.danger : theme.text }]}>
                      {mot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                rotulo="Justificativa / Observações"
                placeholder="Ex: Almoço das crianças / Embalagem rasgada"
                value={justificativa}
                onChangeText={setJustificativa}
              />

              {motivoSaida.toLowerCase().includes('perda') && (
                <View style={[estilosStockRemove.blocoTravaPerda, { backgroundColor: `${theme.danger}10`, borderColor: theme.danger }]}>
                  <Text style={[estilosStockRemove.textoAvisoPerda, { color: theme.danger, fontSize: 12 * fontScale }]}>
                    🔒 Trava de Segurança
                  </Text>
                  <Text style={[estilosStockRemove.instrucaoPerda, { color: theme.text }]}>
                    Para autorizar o descarte, digite a palavra <Text style={{ fontWeight: 'bold', color: theme.danger }}>PERDA</Text> em maiúsculas:
                  </Text>

                  <AppInput
                    rotulo=""
                    placeholder="Digite PERDA aqui"
                    autoCapitalize="characters"
                    value={palavraTravaPerda}
                    onChangeText={setPalavraTravaPerda}
                  />
                </View>
              )}

              <View style={{ marginTop: 16 }}>
                {processandoBaixa ? (
                  <ActivityIndicator size="large" color={theme.danger} />
                ) : (
                  <AppButton
                    title={motivoSaida.toLowerCase().includes('perda') ? 'Confirmar Descarte por Perda' : 'Confirmar Saída do Estoque'}
                    variant="danger"
                    onPress={confirmarBaixa}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 3: FEEDBACK DE SUCESSO */}
      <Modal
        visible={modalSucessoVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={concluirEFecharTudo}
      >
        <View style={estilosStockRemove.modalOverlay}>
          <View style={[estilosStockRemove.modalCard, { backgroundColor: theme.surface, padding: 24 }]}>
            
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Feather name="check-circle" size={32} color="#10B981" />
              </View>
              <Text style={{ fontSize: 20 * fontScale, fontWeight: '900', color: theme.text }}>Saída Concluída!</Text>
              <Text style={{ fontSize: 13 * fontScale, color: theme.subtext, textAlign: 'center', marginTop: 4 }}>
                Os itens foram retirados do estoque e a movimentação foi auditada.
              </Text>
            </View>

            {loteSelecionado && resumoBaixa && (
              <View style={{ backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 12 }}>
                  <Image
                    source={loteSelecionado.foto_url ? { uri: loteSelecionado.foto_url } : obterPlaceholderPorCategoria(loteSelecionado.categoria)}
                    style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 13 * fontScale }} numberOfLines={2}>
                      {loteSelecionado.nome_produto}
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, marginTop: 2 }}>
                      Lote: {loteSelecionado.numero_codigo_lote}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>Quantidade Removida:</Text>
                  <Text style={{ color: resumoBaixa.motivo.includes('perda') ? theme.danger : theme.secondary, fontWeight: '900' }}>
                    {resumoBaixa.qtd} pacotes
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.subtext }}>Novo saldo do lote:</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                    {resumoBaixa.saldoNovo} pacotes
                  </Text>
                </View>
              </View>
            )}

            <AppButton
              title="Ok, Entendi"
              variant="primary"
              onPress={concluirEFecharTudo}
            />

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}