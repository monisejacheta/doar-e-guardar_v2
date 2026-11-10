// src/app/stock-remove.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  RefreshControl,
  StyleSheet,
  Platform,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useAppTheme } from '../context/ThemeContext';
import { estilosStockRemove } from '../styles/stock-remove.styles';
import { requisicaoApi } from '../services/api';
import { resolverFotoProduto } from '../utils/imageUtils';
import { normalizarDescricaoPrateleira } from '../services/storageLocations';
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
  const [recarregando, setRecarregando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');

  // Scanner de código de barras para localização rápida na baixa
  const [permissaoCamera, solicitarPermissaoCamera] = useCameraPermissions();
  const [modalCameraVisivel, setModalCameraVisivel] = useState(false);
  const [modalLeituraManualVisivel, setModalLeituraManualVisivel] = useState(false);
  const [codigoDigitadoManual, setCodigoDigitadoManual] = useState('');
  const [forcandoLeitura, setForcandoLeitura] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const leituraProcessadaRef = useRef(false);

  // Modais e Seleções
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);
  const [modalLotesVisivel, setModalLotesVisivel] = useState(false);

  const [loteSelecionado, setLoteSelecionado] = useState<LoteItem | null>(null);
  const [modalSaidaVisivel, setModalSaidaVisivel] = useState(false);

  // Modal de Sucesso Visual
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [resumoBaixa, setResumoBaixa] = useState<{ qtd: number; saldoNovo: number; motivo: string } | null>(null);

  // Estados do Formulário - Motivos de Saída simplificados para duas opções exatas
  const motivosDisponiveis = [
    'saida regular',
    'perda de produto',
  ];

  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  const [motivoSaida, setMotivoSaida] = useState('saida regular');
  const [justificativa, setJustificativa] = useState('');
  const [palavraTravaPerda, setPalavraTravaPerda] = useState('');
  const [processandoBaixa, setProcessandoBaixa] = useState(false);

  // Variável booleana da trava de segurança (exigida e exibida estritamente para "perda de produto")
  const exigeTravaSeguranca = motivoSaida === 'perda de produto';

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
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        const lotesProcessados = resposta.lotes
          .filter((l: any) => Number(l.quantidade_atual_pacote) > 0)
          .map((l: any) => ({
            ...l,
            local_descricao: normalizarDescricaoPrateleira(l.local_descricao),
            quantidade_atual_pacote: Number(l.quantidade_atual_pacote),
            data_ms: converterDataParaMs(l.data_validade_lote),
          }));
        setLotesRaw(lotesProcessados);
      } else {
        setLotesRaw([]);
      }
    } catch (erro: any) {
      Alert.alert('Erro de Conexão', erro?.message || 'Não foi possível carregar os itens do estoque no servidor.');
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstoque();
  }, [carregarEstoque]);

  // Agrupa os produtos e ordena FEFO internamente
  const todosProdutosAgrupados = useMemo(() => {
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

    const lista = Array.from(mapa.values());

    // FEFO: Ordena os lotes dentro de cada produto pela data de vencimento mais próxima
    lista.forEach((p) => {
      p.lotes.sort((a, b) => a.data_ms - b.data_ms);
    });

    return lista.sort((a, b) => a.nome_produto.localeCompare(b.nome_produto));
  }, [lotesRaw]);

  const produtosFiltrados = useMemo(() => {
    const termo = termoBusca.toLowerCase().trim();
    if (!termo) return todosProdutosAgrupados;
    return todosProdutosAgrupados.filter(
      (p) =>
        p.nome_produto.toLowerCase().includes(termo) ||
        p.codigo_barra_produto.includes(termo) ||
        p.categoria.toLowerCase().includes(termo)
    );
  }, [todosProdutosAgrupados, termoBusca]);

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

  const abrirScannerBusca = async () => {
    try {
      if (!permissaoCamera?.granted) {
        const resp = await solicitarPermissaoCamera();
        if (!resp.granted) {
          Alert.alert('Permissão Necessária', 'Autorize o uso da câmera para escanear o código de barras do produto.');
          return;
        }
      }
      leituraProcessadaRef.current = false;
      setModalCameraVisivel(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível acessar a câmera.');
    }
  };

  // Leitura Automática Contínua: Assim que detectado com sucesso, captura o número e retorna automaticamente
  const aoEscanearCodigoParaSaida = (resultado: any) => {
    if (leituraProcessadaRef.current) return;
    const raw = String(resultado?.data || (resultado as any)?.raw || '').trim();
    if (!raw) return;

    const apenasDigitos = raw.replace(/\D/g, '');
    const eanLido = apenasDigitos.length >= 6 ? apenasDigitos : raw;
    if (!eanLido) return;

    leituraProcessadaRef.current = true;
    try {
      Vibration.vibrate(100);
    } catch {}

    setModalCameraVisivel(false);
    setTermoBusca(eanLido);

    const encontrado = todosProdutosAgrupados.find((p) => p.codigo_barra_produto === eanLido);
    if (encontrado) {
      setProdutoSelecionado(encontrado);
      setModalLotesVisivel(true);
    } else {
      Alert.alert(
        'Produto Localizado',
        `Código EAN ${eanLido} identificado. O número foi preenchido na busca de saída.`
      );
    }
  };

  // Força a captura do frame atual ou engatilha a confirmação manual caso o scanner automático falhe
  const handleForcarLeituraSaida = async () => {
    setForcandoLeitura(true);
    try {
      if (Platform.OS === 'android' && CameraView.isModernBarcodeScannerAvailable) {
        leituraProcessadaRef.current = false;
        const sub = CameraView.onModernBarcodeScanned((event) => {
          sub?.remove();
          aoEscanearCodigoParaSaida(event);
        });
        await CameraView.launchScanner({
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        });
        setForcandoLeitura(false);
        return;
      }
    } catch (e) {
      console.warn('[Forçar Leitura Saída] Erro:', e);
    }
    setForcandoLeitura(false);
    setCodigoDigitadoManual(termoBusca || '');
    setModalLeituraManualVisivel(true);
  };

  const handleSelecionarLote = (lote: LoteItem) => {
    if (!produtoSelecionado) return;

    // O array está ordenado FEFO, então o índice 0 é sempre o mais urgente
    const loteMaisProximo = produtoSelecionado.lotes[0];

    if (lote.id_lote_produto !== loteMaisProximo.id_lote_produto && lote.data_ms > loteMaisProximo.data_ms) {
      Alert.alert(
        'Atenção à Validade (FEFO)',
        `Existe um lote com vencimento mais próximo (${loteMaisProximo.data_validade_lote}) que deve ser priorizado.\n\nDeseja mesmo retirar o lote selecionado?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => abrirFormularioSaida(lote) },
        ]
      );
    } else {
      abrirFormularioSaida(lote);
    }
  };

  const abrirFormularioSaida = (lote: LoteItem) => {
    setLoteSelecionado(lote);
    setQuantidadeSaida('');
    setMotivoSaida('saida regular');
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

    // Trava de segurança obrigatória: exigida exclusivamente para "perda de produto"
    if (exigeTravaSeguranca) {
      if (palavraTravaPerda.trim() !== 'PERDA') {
        Alert.alert(
          'Trava de Segurança Obrigatória',
          'Para autorizar o descarte por perda de produto, digite exatamente a palavra "PERDA" em letras maiúsculas.'
        );
        return;
      }
      if (!justificativa.trim()) {
        Alert.alert('Justificativa Obrigatória', 'Por favor, descreva o motivo da perda do produto para o registro de auditoria.');
        return;
      }
    }

    const usuarioResponsavel =
      auth.currentUser?.email || auth.currentUser?.displayName || auth.currentUser?.uid || 'operador';

    setProcessandoBaixa(true);
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'saida_produto',
          id_lote_produto: loteSelecionado.id_lote_produto,
          lote: loteSelecionado,
          quantidade: qtd,
          motivo_saida: motivoSaida,
          palavra_confirmacao: palavraTravaPerda.trim(),
          justificativa: justificativa.trim(),
          id_usuario: usuarioResponsavel,
        },
      });

      if (resposta?.sucesso) {
        const novoSaldoCalculado =
          typeof resposta.novo_saldo === 'number'
            ? resposta.novo_saldo
            : loteSelecionado.quantidade_atual_pacote - qtd;

        setResumoBaixa({ qtd, saldoNovo: novoSaldoCalculado, motivo: motivoSaida });
        setModalSaidaVisivel(false);
        setModalSucessoVisivel(true);
      } else {
        Alert.alert('Falha na Baixa', resposta?.mensagem || 'Não foi possível registrar a baixa no servidor.');
      }
    } catch (erro: any) {
      Alert.alert('Erro de Comunicação', erro.message || 'Falha ao comunicar com o servidor.');
    } finally {
      setProcessandoBaixa(false);
    }
  };

  const concluirEFecharTudo = async () => {
    setModalSucessoVisivel(false);
    setResumoBaixa(null);
    setProdutoSelecionado(null);
    setLoteSelecionado(null);
    setCarregando(true);
    await carregarEstoque();
  };

  return (
    <SafeAreaView style={[estilosStockRemove.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={estilosStockRemove.rolagem}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={() => {
              setRecarregando(true);
              carregarEstoque();
            }}
            tintColor={theme.danger}
          />
        }
      >
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
            Selecione ou escaneie o item no estoque para dar baixa. Lotes próximos do vencimento (FEFO) são priorizados.
          </Text>
        </View>

        <View style={estilosStockRemove.searchBarRow}>
          <View style={[estilosStockRemove.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Buscar por nome ou código EAN..."
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

          <TouchableOpacity
            onPress={abrirScannerBusca}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Escanear código de barras para dar saída"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: theme.danger,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.danger} style={{ marginTop: 40 }} />
        ) : produtosFiltrados.length === 0 ? (
          <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>
            Nenhum produto com saldo disponível localizado no estoque.
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
                  source={resolverFotoProduto(item.foto_url, item.categoria)}
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
                    Toque para selecionar lote ({item.lotes.length})
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

      {/* MODAL DA CÂMERA PARA ESCANEAR EAN NA SAÍDA */}
      <Modal
        visible={modalCameraVisivel}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          leituraProcessadaRef.current = false;
          setModalCameraVisivel(false);
        }}
      >
        <SafeAreaView style={estilosCameraSaida.container}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            autofocus="on"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14', 'qr'],
            }}
            onBarcodeScanned={aoEscanearCodigoParaSaida}
          />
          <View style={estilosCameraSaida.topo}>
            <TouchableOpacity
              onPress={() => {
                leituraProcessadaRef.current = false;
                setModalCameraVisivel(false);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Voltar para a tela de saída de produtos"
              style={estilosCameraSaida.botaoVoltar}
            >
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
              <Text style={estilosCameraSaida.textoBotaoVoltar}>Voltar</Text>
            </TouchableOpacity>
          </View>

          <View style={estilosCameraSaida.centro}>
            <View style={estilosCameraSaida.mira} />
            <Text style={estilosCameraSaida.texto}>
              Aponte a câmera para o código de barras (EAN) do item
            </Text>
          </View>

          <View style={estilosCameraSaida.rodape}>
            <TouchableOpacity
              onPress={handleForcarLeituraSaida}
              disabled={forcandoLeitura}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Realizar Leitura do código de barras"
              style={estilosCameraSaida.botaoRealizarLeitura}
              activeOpacity={0.8}
            >
              {forcandoLeitura ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="maximize-2" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={estilosCameraSaida.textoBotaoRealizarLeitura}>Realizar Leitura</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCodigoDigitadoManual(termoBusca || '');
                setModalLeituraManualVisivel(true);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Digitar código de barras manualmente"
              style={estilosCameraSaida.botaoManualRapido}
              activeOpacity={0.8}
            >
              <Feather name="edit-3" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={estilosCameraSaida.textoBotaoManualRapido}>Digitar Manualmente</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO MANUAL SE O SCANNER AUTOMÁTICO FALHAR */}
      <Modal
        visible={modalLeituraManualVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLeituraManualVisivel(false)}
      >
        <View style={estilosStockRemove.modalOverlay}>
          <View style={[estilosStockRemove.modalCard, { padding: 20 }]}>
            <Text style={{ fontSize: 16 * fontScale, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
              Informar Código de Barras (EAN)
            </Text>
            <Text style={{ fontSize: 12 * fontScale, color: theme.subtext, marginBottom: 14 }}>
              Digite os dígitos do código de barras da embalagem para dar andamento ao fluxo de saída:
            </Text>
            <TextInput
              placeholder="Ex: 7891000100103"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              autoFocus={true}
              value={codigoDigitadoManual}
              onChangeText={setCodigoDigitadoManual}
              style={{
                borderWidth: 1.5,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setModalLeituraManualVisivel(false)}
                style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}
              >
                <Text style={{ color: theme.subtext, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!codigoDigitadoManual.trim()) {
                    Alert.alert('Atenção', 'Informe o código de barras para continuar.');
                    return;
                  }
                  setModalLeituraManualVisivel(false);
                  aoEscanearCodigoParaSaida({ data: codigoDigitadoManual.trim() } as any);
                }}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: theme.danger, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 1: Lista de Lotes (FEFO) */}
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
                source={resolverFotoProduto(produtoSelecionado?.foto_url, produtoSelecionado?.categoria)}
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
                Selecione o Lote para dar baixa (Ordem FEFO):
              </Text>

              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
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
                          Validade: {lote.data_validade_lote} {isMaisUrgente ? '(Prioridade FEFO)' : ''}
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
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>
                  Lote: {loteSelecionado?.numero_codigo_lote} • Local: {loteSelecionado?.local_descricao}
                </Text>
              </View>

              <AppInput
                rotulo={`Quantidade a retirar (Disponível: ${loteSelecionado?.quantidade_atual_pacote})`}
                placeholder="0"
                keyboardType="numeric"
                value={quantidadeSaida}
                onChangeText={(txt) => setQuantidadeSaida(txt.replace(/\D/g, ''))}
              />

              <Text style={[estilosStockRemove.labelForm, { color: theme.text, fontSize: 12 * fontScale }]}>
                Motivo da Saída:
              </Text>
              <View style={estilosStockRemove.gradeMotivos}>
                {motivosDisponiveis.map((mot) => {
                  const estaSelecionado = motivoSaida === mot;
                  const ehPerda = mot === 'perda de produto';
                  const corDestaque = ehPerda ? theme.danger : theme.primary;

                  return (
                    <TouchableOpacity
                      key={mot}
                      onPress={() => setMotivoSaida(mot)}
                      style={[
                        estilosStockRemove.botaoMotivo,
                        {
                          backgroundColor: estaSelecionado ? `${corDestaque}18` : theme.background,
                          borderColor: estaSelecionado ? corDestaque : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          estilosStockRemove.textoMotivo,
                          {
                            color: estaSelecionado ? corDestaque : theme.text,
                            fontWeight: estaSelecionado ? '700' : '500',
                          },
                        ]}
                      >
                        {mot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppInput
                rotulo="Justificativa / Observações"
                placeholder={exigeTravaSeguranca ? "Ex: Embalagem avariada / Validade expirada" : "Ex: Preparo de refeições / Atendimento regular"}
                value={justificativa}
                onChangeText={setJustificativa}
              />

              {exigeTravaSeguranca && (
                <View style={[estilosStockRemove.blocoTravaPerda, { backgroundColor: `${theme.danger}10`, borderColor: theme.danger }]}>
                  <Text style={[estilosStockRemove.textoAvisoPerda, { color: theme.danger, fontSize: 12 * fontScale }]}>
                    🔒 Trava de Segurança Obrigatória
                  </Text>
                  <Text style={[estilosStockRemove.instrucaoPerda, { color: theme.text }]}>
                    Para autorizar a baixa por perda de produto, digite a palavra <Text style={{ fontWeight: 'bold', color: theme.danger }}>PERDA</Text> em maiúsculas:
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
                    title={exigeTravaSeguranca ? 'Confirmar Descarte por Perda' : 'Confirmar Saída Regular'}
                    variant={exigeTravaSeguranca ? 'danger' : 'primary'}
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
                Os itens foram baixados no banco de dados e a movimentação foi auditada.
              </Text>
            </View>

            {loteSelecionado && resumoBaixa && (
              <View style={{ backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 12 }}>
                  <Image
                    source={resolverFotoProduto(loteSelecionado.foto_url || loteSelecionado.url_foto_produto, loteSelecionado.categoria)}
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
                  <Text style={{ color: resumoBaixa.motivo === 'perda de produto' ? theme.danger : theme.secondary, fontWeight: '900' }}>
                    {resumoBaixa.qtd} pacotes ({resumoBaixa.motivo})
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

const estilosCameraSaida = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  topo: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  botaoVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textoBotaoVoltar: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mira: {
    width: 280,
    height: 170,
    borderWidth: 2.5,
    borderColor: '#EF4444',
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  texto: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  rodape: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
    zIndex: 10,
  },
  botaoRealizarLeitura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    minHeight: 52,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  textoBotaoRealizarLeitura: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  botaoManualRapido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  textoBotaoManualRapido: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 13,
  },
});

