// app-mobile/src/app/stock-add.tsx
import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';

const FOTO_PLACEHOLDER_ALIMENTO =
  'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=400&q=80';

interface DadosResumoSalvo {
  nome_produto: string;
  marca_produto?: string;
  codigo_barra: string;
  categoria: string;
  unidade_medida: string;
  numero_lote: string;
  quantidade: number;
  validade: string;
  local: string;
  url_foto: string;
}

export default function StockAddScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Etapa: 1 = Código de Barras | 2 = Dados do Produto (se novo) | 3 = Dados do Lote
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [produtoExistenteNoBanco, setProdutoExistenteNoBanco] = useState<boolean | null>(null);

  // Campos do Produto
  const [codigoBarras, setCodigoBarras] = useState('');
  const [idProduto, setIdProduto] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [marcaProduto, setMarcaProduto] = useState('');
  const [categoria, setCategoria] = useState('Grãos e Cereais');
  const [unidadeMedida, setUnidadeMedida] = useState('pacotes');
  const [estoqueMinimo, setEstoqueMinimo] = useState('10');
  const [urlFotoProduto, setUrlFotoProduto] = useState(FOTO_PLACEHOLDER_ALIMENTO);
  const [origemDados, setOrigemDados] = useState<string>('');

  // Campos do Lote
  const [numeroLote, setNumeroLote] = useState('');
  const [quantidadePacotes, setQuantidadePacotes] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [localArmazenamento, setLocalArmazenamento] = useState('Armário A - Prat. 1');

  // Estados de Controle
  const [carregandoVerificacao, setCarregandoVerificacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Modal de Feedback
  const [modalFeedbackVisivel, setModalFeedbackVisivel] = useState(false);
  const [tipoFeedback, setTipoFeedback] = useState<'sucesso' | 'erro'>('sucesso');
  const [mensagemFeedback, setMensagemFeedback] = useState('');
  const [dadosResumo, setDadosResumo] = useState<DadosResumoSalvo | null>(null);

  const categoriasDisponiveis = [
    'Grãos e Cereais',
    'Laticínios',
    'Massas',
    'Enlatados',
    'Óleos e Gorduras',
    'Higiene e Limpeza',
  ];

  const locaisDisponiveis = [
    'Armário A - Prat. 1',
    'Armário A - Prat. 2',
    'Armário B - Prat. 3',
    'Geladeira 1 - Prat. Central',
    'Geladeira 2 - Gaveta Inferior',
    'Despensa Seca - Prateleira 1',
  ];

  // Máscaras de entrada
  const lidarComMascaraData = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '').slice(0, 8);
    let formatado = apenasNumeros;
    if (apenasNumeros.length > 2 && apenasNumeros.length <= 4) {
      formatado = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
    } else if (apenasNumeros.length > 4) {
      formatado = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
    }
    setDataValidade(formatado);
  };

  const lidarComMascaraEan = (texto: string) => {
    setCodigoBarras(texto.replace(/\D/g, '').slice(0, 14));
  };

  const lidarComMascaraQuantidade = (texto: string) => {
    setQuantidadePacotes(texto.replace(/\D/g, ''));
  };

  const lidarComMascaraEstoqueMinimo = (texto: string) => {
    setEstoqueMinimo(texto.replace(/\D/g, ''));
  };

  const rolarParaAbaixo = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 350, animated: true });
    }, 150);
  };

  // FLUXO: Envia código para as 3 APIs e verifica se já existe no estoque
  const processarCodigoBarras = async (eanInformado?: string) => {
    const ean = (eanInformado || codigoBarras).trim();

    if (!ean || ean.length < 8) {
      Alert.alert('Código Inválido', 'Digite um código de barras de 8 a 14 dígitos numéricos.');
      return;
    }

    setCodigoBarras(ean);
    setCarregandoVerificacao(true);

    try {
      const resp: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'verificar_produto', codigo_barras: ean },
      });

      if (resp?.sucesso) {
        const sufixoLote = Math.floor(Math.random() * 899 + 100);
        setNumeroLote(`LOTE-${new Date().getFullYear()}-${sufixoLote}`);

        if (resp.existe_no_banco && resp.produto) {
          // CENÁRIO A: PRODUTO JÁ EXISTE NO ESTOQUE
          const p = resp.produto;
          setIdProduto(p.id_produto);
          setNomeProduto(p.nome_produto);
          setMarcaProduto(p.marca_produto || '');
          setCategoria(p.categoria || 'Grãos e Cereais');
          setUnidadeMedida(p.unidade_medida_pacote || 'pacotes');
          setEstoqueMinimo(String(p.estoque_minimo_pacote || 10));
          setUrlFotoProduto(p.url_foto_produto || FOTO_PLACEHOLDER_ALIMENTO);
          setOrigemDados(p.origem || 'Produto já existente no estoque');
          setProdutoExistenteNoBanco(true);

          // Pula direto para a Etapa 3 (Adicionar novo lote)
          setEtapa(3);
          rolarParaAbaixo();
        } else if (resp.produto) {
          // CENÁRIO B: PRODUTO NOVO LOCALIZADO NAS APIS EXTERNAS
          const p = resp.produto;
          setIdProduto(p.id_produto || `prod_${Date.now().toString().slice(-6)}`);
          setNomeProduto(p.nome_produto);
          setMarcaProduto(p.marca_produto || '');
          setCategoria(p.categoria || 'Grãos e Cereais');
          setUnidadeMedida('pacotes');
          setEstoqueMinimo(String(p.estoque_minimo_pacote || 10));
          setUrlFotoProduto(p.url_foto_produto || FOTO_PLACEHOLDER_ALIMENTO);
          setOrigemDados(p.origem || 'Localizado na cascata de APIs');
          setProdutoExistenteNoBanco(false);

          // Abre a Etapa 2 para conferência cadastral do novo produto
          setEtapa(2);
          rolarParaAbaixo();
        } else {
          // CENÁRIO C: PRODUTO NOVO NÃO LOCALIZADO NAS APIS (CADASTRO MANUAL)
          setIdProduto(`prod_${Date.now().toString().slice(-6)}`);
          setNomeProduto('');
          setMarcaProduto('');
          setUrlFotoProduto(FOTO_PLACEHOLDER_ALIMENTO);
          setOrigemDados('Item não localizado nas APIs (Preenchimento manual)');
          setProdutoExistenteNoBanco(false);

          setEtapa(2);
          rolarParaAbaixo();

          Alert.alert(
            'Item Não Catalogado',
            'O código de barras não consta nas bases públicas. O formulário abaixo foi liberado para preenchimento manual.'
          );
        }
      } else {
        throw new Error(resp?.mensagem || 'Erro ao processar consulta de produto.');
      }
    } catch (erro: any) {
      setProdutoExistenteNoBanco(false);
      setIdProduto(`prod_${Date.now().toString().slice(-6)}`);
      setUrlFotoProduto(FOTO_PLACEHOLDER_ALIMENTO);
      setOrigemDados('Contingência manual ativada');
      setEtapa(2);
      rolarParaAbaixo();
    } finally {
      setCarregandoVerificacao(false);
    }
  };

  const salvarLoteNoDynamoDB = async () => {
    if (!numeroLote.trim()) {
      Alert.alert('Lote Obrigatório', 'Informe o número do lote.');
      return;
    }

    const qtd = Number(quantidadePacotes);
    if (!quantidadePacotes.trim() || isNaN(qtd) || qtd <= 0) {
      Alert.alert('Quantidade Inválida', 'Informe uma quantidade de pacotes maior que zero.');
      return;
    }

    if (!dataValidade.trim() || dataValidade.length < 10) {
      Alert.alert('Validade Incompleta', 'Preencha a data no formato DD/MM/AAAA.');
      return;
    }

    const [dia, mes, ano] = dataValidade.split('/');
    const validadeIso = `${ano}-${mes}-${dia}`;
    const nomeCompleto = marcaProduto ? `${nomeProduto} (${marcaProduto})` : nomeProduto;

    const payloadLote = {
      id_lote_produto: `lote_${Date.now().toString().slice(-6)}`,
      id_produto: idProduto,
      nome_produto: nomeCompleto,
      marca_produto: marcaProduto,
      categoria: categoria,
      unidade_medida_pacote: unidadeMedida,
      codigo_barra_produto: codigoBarras,
      numero_codigo_lote: numeroLote.trim().toUpperCase(),
      quantidade_inicial_pacote: qtd,
      quantidade_atual_pacote: qtd,
      estoque_minimo_pacote: Number(estoqueMinimo) || 10,
      data_entrada_lote: new Date().toISOString().slice(0, 10),
      data_validade_lote: validadeIso,
      status_validade_lote: 'regular',
      id_local_armazenamento: `loc_${localArmazenamento.slice(0, 3).toLowerCase()}`,
      local_descricao: localArmazenamento,
      url_foto_produto: urlFotoProduto,
      gravar_novo_produto: !produtoExistenteNoBanco,
    };

    setSalvando(true);
    try {
      const resp: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'cadastrar_lote', lote: payloadLote },
      });

      if (resp?.sucesso) {
        setDadosResumo({
          nome_produto: nomeCompleto,
          marca_produto: marcaProduto,
          codigo_barra: codigoBarras,
          categoria: categoria,
          unidade_medida: unidadeMedida,
          numero_lote: numeroLote.trim().toUpperCase(),
          quantidade: qtd,
          validade: dataValidade,
          local: localArmazenamento,
          url_foto: urlFotoProduto,
        });
        setTipoFeedback('sucesso');
        setMensagemFeedback('Entrada salva com sucesso no DynamoDB!');
        setModalFeedbackVisivel(true);
      } else {
        setTipoFeedback('erro');
        setMensagemFeedback(resp?.mensagem || 'Não foi possível cadastrar o lote.');
        setModalFeedbackVisivel(true);
      }
    } catch (erro: any) {
      setTipoFeedback('erro');
      setMensagemFeedback(erro.message || 'Falha de comunicação com a AWS.');
      setModalFeedbackVisivel(true);
    } finally {
      setSalvando(false);
    }
  };

  const fecharModalFeedback = () => {
    setModalFeedbackVisivel(false);
    if (tipoFeedback === 'sucesso') {
      roteador.replace('/home');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => roteador.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, fontWeight: '600', textTransform: 'uppercase' }}>
              Entrada de Alimentos
            </Text>
            <Text style={{ color: theme.primary, fontSize: 22 * fontScale, fontWeight: '800' }}>
              Cadastrar Lote
            </Text>
          </View>
        </View>

        {/* ETAPA 1: Código de Barras */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1.5,
            borderColor: etapa === 1 ? theme.primary : '#E5E7EB',
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Feather name="maximize" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15 * fontScale, fontWeight: '700', color: theme.text }}>
              1. Identificação do Código de Barras
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => processarCodigoBarras('7891000100103')}
            disabled={carregandoVerificacao}
            style={{
              flexDirection: 'row',
              backgroundColor: '#10B981',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 50,
              marginBottom: 14,
            }}
          >
            <Feather name="camera" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 * fontScale }}>
              Escanear Código com a Câmera
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
            <Text style={{ marginHorizontal: 8, fontSize: 11 * fontScale, color: '#9CA3AF', fontWeight: '600' }}>
              OU DIGITE OS NÚMEROS DO EAN
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          </View>

          <AppInput
            rotulo="Número do Código de Barras (EAN):"
            placeholder="0000000000000"
            keyboardType="numeric"
            value={codigoBarras}
            onChangeText={lidarComMascaraEan}
          />

          <TouchableOpacity
            onPress={() => processarCodigoBarras()}
            disabled={carregandoVerificacao}
            style={{
              backgroundColor: theme.primary,
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
              marginTop: 6,
            }}
          >
            {carregandoVerificacao ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 * fontScale }}>
                Consultar Código e Preencher ➔
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* CENÁRIO A: PRODUTO JÁ EXISTE NO ESTOQUE (Card Informativo) */}
        {produtoExistenteNoBanco === true && etapa >= 2 && (
          <View
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: '#BFDBFE',
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Image
              source={{ uri: urlFotoProduto }}
              style={{ width: 68, height: 68, borderRadius: 12, backgroundColor: '#FFFFFF', marginRight: 14 }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Feather name="check-circle" size={15} color="#1E3A8A" style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: '#1E3A8A' }}>
                  {origemDados}
                </Text>
              </View>
              <Text style={{ fontSize: 15 * fontScale, fontWeight: '800', color: '#111827' }}>
                {nomeProduto}
              </Text>
              <Text style={{ fontSize: 11 * fontScale, color: '#4B5563', marginTop: 2 }}>
                {categoria} • {unidadeMedida}
              </Text>
            </View>
          </View>
        )}

        {/* CENÁRIO B: PRODUTO NOVO (Formulário completo com foto e dados da API) */}
        {produtoExistenteNoBanco === false && etapa >= 2 && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: etapa === 2 ? theme.primary : '#E5E7EB',
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Feather name="zap" size={18} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14 * fontScale, fontWeight: '700', color: theme.text, flex: 1 }}>
                {origemDados}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                marginBottom: 14,
              }}
            >
              <Image
                source={{ uri: urlFotoProduto }}
                style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#E5E7EB', marginRight: 12 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: theme.text }}>
                  Foto do Alimento
                </Text>
                <Text style={{ fontSize: 11 * fontScale, color: '#6B7280', marginTop: 2 }}>
                  {urlFotoProduto === FOTO_PLACEHOLDER_ALIMENTO
                    ? 'Foto padrão aplicada para controle de despensa.'
                    : 'Foto oficial carregada via API.'}
                </Text>
              </View>
            </View>

            <AppInput
              rotulo="Nome descritivo do alimento *"
              placeholder="Ex: Leite Integral UHT 1L"
              value={nomeProduto}
              onChangeText={setNomeProduto}
            />

            <AppInput
              rotulo="Marca ou Fabricante (opcional)"
              placeholder="Ex: Líder / Camil"
              value={marcaProduto}
              onChangeText={setMarcaProduto}
            />

            <Text style={{ fontSize: 12 * fontScale, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              Categoria do Alimento:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {categoriasDisponiveis.map((cat) => {
                const selecionada = categoria === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategoria(cat)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: selecionada ? theme.primary : '#E5E7EB',
                      backgroundColor: selecionada ? `${theme.primary}15` : '#FFFFFF',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12 * fontScale,
                        fontWeight: selecionada ? '700' : '500',
                        color: selecionada ? theme.primary : theme.text,
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppInput
              rotulo="Estoque mínimo de segurança *"
              placeholder="10"
              keyboardType="numeric"
              value={estoqueMinimo}
              onChangeText={lidarComMascaraEstoqueMinimo}
            />

            <TouchableOpacity
              onPress={() => {
                if (!nomeProduto.trim()) {
                  Alert.alert('Campo Obrigatório', 'Informe o nome do alimento.');
                  return;
                }
                setEtapa(3);
                rolarParaAbaixo();
              }}
              style={{
                backgroundColor: theme.primary,
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
                marginTop: 6,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 * fontScale }}>
                Confirmar Dados do Alimento ➔
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ETAPA 3: DADOS DO LOTE (Novo lote para existente ou 1º lote de produto novo) */}
        {etapa === 3 && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: '#10B981',
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Feather name="layers" size={20} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15 * fontScale, fontWeight: '700', color: theme.text }}>
                {produtoExistenteNoBanco ? 'Adicionar Novo Lote ao Produto' : 'Informações do Lote'}
              </Text>
            </View>

            <AppInput
              rotulo="Número ou Código do Lote *"
              placeholder="LOTE-0000-00"
              autoCapitalize="characters"
              value={numeroLote}
              onChangeText={setNumeroLote}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  rotulo="Quantidade (pacotes) *"
                  placeholder="00"
                  keyboardType="numeric"
                  value={quantidadePacotes}
                  onChangeText={lidarComMascaraQuantidade}
                />
              </View>

              <View style={{ flex: 1 }}>
                <AppInput
                  rotulo="Validade (DD/MM/AAAA) *"
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                  maxLength={10}
                  value={dataValidade}
                  onChangeText={lidarComMascaraData}
                />
              </View>
            </View>

            <Text style={{ fontSize: 12 * fontScale, fontWeight: '600', color: theme.text, marginBottom: 8, marginTop: 4 }}>
              Local de Armazenamento:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {locaisDisponiveis.map((loc) => {
                const selecionado = localArmazenamento === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => setLocalArmazenamento(loc)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: selecionado ? '#10B981' : '#E5E7EB',
                      backgroundColor: selecionado ? '#ECFDF5' : '#FFFFFF',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12 * fontScale,
                        fontWeight: selecionado ? '700' : '500',
                        color: selecionado ? '#047857' : theme.text,
                      }}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {salvando ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 8 }} />
            ) : (
              <AppButton
                title={produtoExistenteNoBanco ? '✔ Salvar Novo Lote' : '✔ Cadastrar Produto e Lote'}
                variant="secondary"
                onPress={salvarLoteNoDynamoDB}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Confirmação com Imagem e "Ok, entendi" */}
      <Modal
        visible={modalFeedbackVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={fecharModalFeedback}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              padding: 20,
              elevation: 8,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: tipoFeedback === 'sucesso' ? '#ECFDF5' : '#FEF2F2',
                  borderWidth: 2,
                  borderColor: tipoFeedback === 'sucesso' ? '#10B981' : '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Feather
                  name={tipoFeedback === 'sucesso' ? 'check' : 'alert-circle'}
                  size={28}
                  color={tipoFeedback === 'sucesso' ? '#10B981' : '#EF4444'}
                />
              </View>

              <Text
                style={{
                  fontSize: 17 * fontScale,
                  fontWeight: '800',
                  color: tipoFeedback === 'sucesso' ? '#065F46' : '#991B1B',
                  textAlign: 'center',
                }}
              >
                {tipoFeedback === 'sucesso' ? 'Entrada Confirmada!' : 'Falha na Gravação'}
              </Text>
              <Text style={{ fontSize: 11.5 * fontScale, color: '#4B5563', textAlign: 'center', marginTop: 3 }}>
                {mensagemFeedback}
              </Text>
            </View>

            {tipoFeedback === 'sucesso' && dadosResumo && (
              <View
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Image
                    source={{ uri: dadosResumo.url_foto }}
                    style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: '#E5E7EB', marginRight: 10 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13 * fontScale, fontWeight: '800', color: '#111827' }}>
                      {dadosResumo.nome_produto}
                    </Text>
                    <Text style={{ fontSize: 11 * fontScale, color: '#4B5563', marginTop: 1 }}>
                      {dadosResumo.categoria} • {dadosResumo.quantidade} {dadosResumo.unidade_medida}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11 * fontScale, color: '#6B7280' }}>Lote:</Text>
                    <Text style={{ fontSize: 11 * fontScale, fontWeight: '700', color: '#111827' }}>
                      {dadosResumo.numero_lote}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11 * fontScale, color: '#6B7280' }}>EAN:</Text>
                    <Text style={{ fontSize: 11 * fontScale, fontWeight: '600', color: '#374151' }}>
                      {dadosResumo.codigo_barra}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11 * fontScale, color: '#6B7280' }}>Validade (FEFO):</Text>
                    <Text style={{ fontSize: 11 * fontScale, fontWeight: '800', color: '#1E3A8A' }}>
                      {dadosResumo.validade}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11 * fontScale, color: '#6B7280' }}>Local Físico:</Text>
                    <Text style={{ fontSize: 11 * fontScale, fontWeight: '700', color: '#111827' }}>
                      {dadosResumo.local}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={fecharModalFeedback}
              style={{
                minHeight: 46,
                backgroundColor: tipoFeedback === 'sucesso' ? '#10B981' : theme.primary,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 * fontScale }}>
                Ok, entendi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}