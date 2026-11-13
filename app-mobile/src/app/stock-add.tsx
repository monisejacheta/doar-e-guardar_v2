// app-mobile/src/app/stock-add.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppNumericInput } from '../components/common/AppNumericInput';
import { AppDateInput } from '../components/common/AppDateInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';
import { auth } from '../services/firebaseConfig';
import {
  CategoriaAlimentoItem,
  CATEGORIAS_PADRAO_SISTEMA,
  alternarVisibilidadeCategoria,
  carregarCategoriasComEstado,
  criarEPersistirCategoria,
} from '../services/categoriesService';
import { converterParaIso, estaVencido } from '../utils/dateValidation';
import {
  LOCAIS_HOMOLOGADOS_PADRAO,
  carregarPrateleirasAws,
  resolverPrateleiraPorDescricaoOuId,
} from '../services/storageLocations';

interface ProdutoRetornadoApi {
  id_produto?: string;
  codigo_barra_produto?: string;
  nome_produto: string;
  marca_produto?: string;
  categoria?: string;
  unidade_medida_pacote?: string;
  estoque_minimo_pacote?: number;
  url_foto_produto?: string;
  foto_url?: string;
  origem?: string;
}

interface RespostaVerificacaoProduto {
  sucesso: boolean;
  existe_no_banco?: boolean;
  encontrado_nas_apis?: boolean;
  provedor_utilizado?: string;
  permitir_cadastro_manual?: boolean;
  produto?: ProdutoRetornadoApi | null;
  erros?: string[];
  tentativas_apis?: { api: string; status: string; origem?: string }[];
  mensagem?: string;
}

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

const CATEGORIAS_INSTITUCIONAIS = [
  'Grãos e Cereais',
  'Laticínios',
  'Massas',
  'Enlatados',
  'Óleos e Gorduras',
  'Higiene e Limpeza',
];

const LOCAIS_PADRAO_HOMOLOGADOS = LOCAIS_HOMOLOGADOS_PADRAO.map((l) => l.local_descricao);

const inferirCategoriaAlimento = (nome: string, categoriaApi?: string): string => {
  if (categoriaApi && CATEGORIAS_INSTITUCIONAIS.includes(categoriaApi)) {
    return categoriaApi;
  }
  const t = `${nome} ${categoriaApi || ''}`.toLowerCase();
  if (t.includes('leite') || t.includes('queijo') || t.includes('iogurte') || t.includes('manteiga') || t.includes('latic')) {
    return 'Laticínios';
  }
  if (t.includes('macarr') || t.includes('massa') || t.includes('espaguete') || t.includes('lasanha')) {
    return 'Massas';
  }
  if (t.includes('óleo') || t.includes('oleo') || t.includes('azeite') || t.includes('gordura')) {
    return 'Óleos e Gorduras';
  }
  if (t.includes('sardinha') || t.includes('atum') || t.includes('milho') || t.includes('ervilha') || t.includes('molho') || t.includes('extrato') || t.includes('lata')) {
    return 'Enlatados';
  }
  if (t.includes('sabonete') || t.includes('sabão') || t.includes('sabao') || t.includes('detergente') || t.includes('papel') || t.includes('higiene') || t.includes('limpeza')) {
    return 'Higiene e Limpeza';
  }
  return 'Grãos e Cereais';
};

export default function StockAddScreen() {
  const roteador = useRouter();
  const { theme, fontScale } = useAppTheme();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Permissão e controle da Câmera para leitura real de código de barras (EAN-8 / EAN-13 / GTIN)
  const [permissaoCamera, solicitarPermissaoCamera] = useCameraPermissions();
  const [modalCameraVisivel, setModalCameraVisivel] = useState(false);
  const [lanternaAtiva, setLanternaAtiva] = useState(false);
  const [modalLeituraManualVisivel, setModalLeituraManualVisivel] = useState(false);
  const [codigoDigitadoManual, setCodigoDigitadoManual] = useState('');
  const [forcandoLeitura, setForcandoLeitura] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const leituraProcessadaRef = useRef(false);
  const [animLaser] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (modalCameraVisivel) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(animLaser, {
            toValue: 140,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(animLaser, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [modalCameraVisivel, animLaser]);

  // Etapa: 1 = Código de Barras | 2 = Dados do Produto (se novo) | 3 = Dados do Lote
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [produtoExistenteNoBanco, setProdutoExistenteNoBanco] = useState<boolean | null>(null);

  // Campos do Produto
  const [codigoBarras, setCodigoBarras] = useState('');
  const [idProduto, setIdProduto] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [marcaProduto, setMarcaProduto] = useState('');
  const [categoria, setCategoria] = useState('Grãos e Cereais');
  const [categoriasItens, setCategoriasItens] = useState<CategoriaAlimentoItem[]>(() =>
    CATEGORIAS_PADRAO_SISTEMA.map((nome, indice) => ({
      id: `init-${indice}`,
      nome,
      oculta: false,
      origem: 'local',
    }))
  );
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [dropdownCategoriasAberto, setDropdownCategoriasAberto] = useState(false);
  const [mostrarCategoriasOcultas, setMostrarCategoriasOcultas] = useState(false);
  const [modalNovaCategoriaVisivel, setModalNovaCategoriaVisivel] = useState(false);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const [unidadeMedida, setUnidadeMedida] = useState('pacotes');
  const [estoqueMinimo, setEstoqueMinimo] = useState('10');
  const [urlFotoProduto, setUrlFotoProduto] = useState('');
  const [erroFotoRemota, setErroFotoRemota] = useState(false);
  const [origemDados, setOrigemDados] = useState<string>('');
  const [errosCascataApis, setErrosCascataApis] = useState<string[]>([]);

  // Campos do Lote
  const [numeroLote, setNumeroLote] = useState('');
  const [quantidadePacotes, setQuantidadePacotes] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>(LOCAIS_PADRAO_HOMOLOGADOS);
  const [localArmazenamento, setLocalArmazenamento] = useState(LOCAIS_PADRAO_HOMOLOGADOS[0]);

  // Filtros e Organização dos Locais de Armazenamento
  const [filtroTipoLocal, setFiltroTipoLocal] = useState<'TODOS' | 'armário' | 'geladeira'>('TODOS');
  const [buscaLocal, setBuscaLocal] = useState('');

  // Estados de Controle
  const [carregandoVerificacao, setCarregandoVerificacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Modal de Feedback
  const [modalFeedbackVisivel, setModalFeedbackVisivel] = useState(false);
  const [tipoFeedback, setTipoFeedback] = useState<'sucesso' | 'erro'>('sucesso');
  const [mensagemFeedback, setMensagemFeedback] = useState('');
  const [dadosResumo, setDadosResumo] = useState<DadosResumoSalvo | null>(null);

  const obterPlaceholderPorCategoria = (catNome: string) => {
    const cat = (catNome || '').toLowerCase();
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

  // Carrega compartimentos reais já utilizados/configurados no banco de dados da AWS
  const carregarLocaisDoBackend = useCallback(async () => {
    try {
      const reconciliacao = await carregarPrateleirasAws();
      if (reconciliacao.locais.length > 0) {
        const descricoes = reconciliacao.locais.map((l) => l.local_descricao);
        setLocaisDisponiveis(descricoes);
        setLocalArmazenamento((atual) =>
          descricoes.includes(atual) ? atual : descricoes[0]
        );
      }
    } catch {
      // Mantém a lista homologada padrão caso o estoque esteja vazio
    }
  }, []);

  // Carrega todas as categorias de alimentos registradas no AWS DynamoDB + estado oculto local
  const carregarCategoriasDoBackend = useCallback(async () => {
    setCarregandoCategorias(true);
    try {
      const resultado = await carregarCategoriasComEstado();
      setCategoriasItens(resultado.categorias);
      const primeiraVisivel = resultado.categorias.find((c) => !c.oculta);
      if (primeiraVisivel) {
        setCategoria((atual) =>
          resultado.categorias.some((c) => !c.oculta && c.nome === atual)
            ? atual
            : primeiraVisivel.nome
        );
      }
    } finally {
      setCarregandoCategorias(false);
    }
  }, []);

  const salvarNovaCategoriaNaAws = async () => {
    const nomeLimpo = nomeNovaCategoria.trim();
    if (!nomeLimpo) {
      Alert.alert('Atenção', 'Informe o nome da categoria para cadastrar.');
      return;
    }

    setSalvandoCategoria(true);
    try {
      const res = await criarEPersistirCategoria(nomeLimpo);
      if (!res.sucesso) {
        Alert.alert('Atenção', res.mensagem || 'Informe um nome válido.');
        return;
      }

      setCategoriasItens((atuais) => {
        const existe = atuais.some((c) => c.nome.toLowerCase() === res.nomeFinal.toLowerCase());
        if (existe) {
          return atuais.map((c) =>
            c.nome.toLowerCase() === res.nomeFinal.toLowerCase() ? { ...c, oculta: false } : c
          );
        }
        return [
          {
            id: `nova-${Date.now()}`,
            nome: res.nomeFinal,
            oculta: false,
            origem: res.sincronizadaAws ? 'dynamodb' : 'local',
          },
          ...atuais,
        ];
      });
      setCategoria(res.nomeFinal);
      setNomeNovaCategoria('');
      setModalNovaCategoriaVisivel(false);
      setDropdownCategoriasAberto(false);
      Alert.alert(
        'Nova Categoria Salva',
        res.sincronizadaAws
          ? `Categoria "${res.nomeFinal}" salva no AWS DynamoDB e exibida na tela!`
          : `Categoria "${res.nomeFinal}" adicionada e persistida no dispositivo.`
      );
    } finally {
      setSalvandoCategoria(false);
    }
  };

  const lidarAlternarOcultarCategoria = async (item: CategoriaAlimentoItem) => {
    const novoOcultar = !item.oculta;
    setCategoriasItens((atuais) =>
      atuais.map((c) => (c.nome === item.nome ? { ...c, oculta: novoOcultar } : c))
    );
    if (novoOcultar && categoria === item.nome) {
      const proxima = categoriasItens.find((c) => !c.oculta && c.nome !== item.nome);
      if (proxima) setCategoria(proxima.nome);
    }
    await alternarVisibilidadeCategoria(item.nome, novoOcultar);
  };

  const categoriasVisiveis = useMemo(
    () => categoriasItens.filter((c) => !c.oculta),
    [categoriasItens]
  );

  const categoriasOcultas = useMemo(
    () => categoriasItens.filter((c) => c.oculta),
    [categoriasItens]
  );

  const categoriasParaExibir = useMemo(
    () => (mostrarCategoriasOcultas ? categoriasItens : categoriasVisiveis),
    [mostrarCategoriasOcultas, categoriasItens, categoriasVisiveis]
  );

  const validadeVencida = useMemo(() => estaVencido(dataValidade), [dataValidade]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregarLocaisDoBackend();
      void carregarCategoriasDoBackend();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarLocaisDoBackend, carregarCategoriasDoBackend]);

  // Estruturação organizada dos locais de armazenamento para facilitar a navegação
  const parsedLocais = useMemo(() => {
    return locaisDisponiveis.map((locDesc) => {
      const partes = locDesc.split(' - ');
      const equipamento = partes[0]?.trim() || locDesc;
      const compartimento = partes.slice(1).join(' - ').trim() || 'Compartimento Único';
      const ehGeladeira = locDesc.toLowerCase().includes('geladeira');
      const tipo = ehGeladeira ? 'geladeira' : 'armário';
      return {
        descricao: locDesc,
        equipamento,
        compartimento,
        tipo,
      };
    });
  }, [locaisDisponiveis]);

  const locaisFiltrados = useMemo(() => {
    return parsedLocais.filter((item) => {
      if (filtroTipoLocal !== 'TODOS' && item.tipo !== filtroTipoLocal) {
        return false;
      }
      if (buscaLocal.trim()) {
        const termo = buscaLocal.trim().toLowerCase();
        return (
          item.descricao.toLowerCase().includes(termo) ||
          item.equipamento.toLowerCase().includes(termo) ||
          item.compartimento.toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [parsedLocais, filtroTipoLocal, buscaLocal]);

  const gruposEquipamentos = useMemo(() => {
    const grupos: Record<string, typeof locaisFiltrados> = {};
    locaisFiltrados.forEach((item) => {
      if (!grupos[item.equipamento]) {
        grupos[item.equipamento] = [];
      }
      grupos[item.equipamento].push(item);
    });
    return grupos;
  }, [locaisFiltrados]);

  // Máscaras de entrada
  const lidarComMascaraEan = (texto: string) => {
    const limpo = texto.replace(/\D/g, '').slice(0, 14);
    setCodigoBarras(limpo);
    if (etapa !== 1) {
      setEtapa(1);
      setProdutoExistenteNoBanco(null);
      setErrosCascataApis([]);
    }
  };

  const lidarComMascaraQuantidade = (texto: string) => {
    setQuantidadePacotes(texto.replace(/\D/g, ''));
  };

  const lidarComMascaraEstoqueMinimo = (texto: string) => {
    setEstoqueMinimo(texto.replace(/\D/g, ''));
  };

  const rolarParaAbaixo = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 340, animated: true });
    }, 150);
  };

  // Abertura da câmera física para leitura de código de barras
  const abrirScannerCamera = async () => {
    try {
      if (!permissaoCamera?.granted) {
        const respostaPermissao = await solicitarPermissaoCamera();
        if (!respostaPermissao.granted) {
          Alert.alert(
            'Permissão da Câmera Necessária',
            'Autorize o acesso à câmera nas configurações do aparelho para ler códigos de barras, ou digite os números do EAN manualmente.'
          );
          return;
        }
      }
      leituraProcessadaRef.current = false;
      setLanternaAtiva(false);
      setModalCameraVisivel(true);
    } catch (erro: any) {
      Alert.alert(
        'Câmera Indisponível',
        erro?.message || 'Não foi possível iniciar a câmera neste dispositivo. Digite o código EAN manualmente.'
      );
    }
  };

  const aoLerCodigoCamera = (resultado: any) => {
    if (leituraProcessadaRef.current) return;
    const raw = String(resultado?.data ?? resultado?.raw ?? resultado ?? '').trim();
    if (!raw) return;

    leituraProcessadaRef.current = true;
    try {
      Vibration.vibrate(100);
    } catch {}

    setLanternaAtiva(false);
    setModalCameraVisivel(false);

    // Extrai números para formato EAN/GTIN ou preserva o código identificado
    const apenasDigitos = raw.replace(/\D/g, '');
    const codigoIdentificado = apenasDigitos.length >= 6 ? apenasDigitos : raw;

    // Retorna para a tela de cadastro com o número do código de barras preenchido no campo correspondente
    setCodigoBarras(codigoIdentificado);

    // Se possui formato padrão EAN (8 a 14 dígitos numéricos), consulta nas 3 APIs em cascata
    if (codigoIdentificado.length >= 8 && codigoIdentificado.length <= 14 && /^\d+$/.test(codigoIdentificado)) {
      processarCodigoBarras(codigoIdentificado);
    } else {
      // Se for outro tipo de código ou alfanumérico, avança para a conferência manual com o campo preenchido
      setEtapa(2);
      rolarParaAbaixo();
    }
  };

  // Força a leitura do frame atual ou engatilha a confirmação manual caso o scanner automático falhe por foco ou iluminação
  const handleForcarLeituraCadastro = async () => {
    setForcandoLeitura(true);
    try {
      if (Platform.OS === 'android' && CameraView.isModernBarcodeScannerAvailable) {
        leituraProcessadaRef.current = false;
        const sub = CameraView.onModernBarcodeScanned((event) => {
          sub?.remove();
          aoLerCodigoCamera(event);
        });
        await CameraView.launchScanner({
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14', 'qr'],
        });
        setForcandoLeitura(false);
        return;
      }
    } catch (err: any) {
      console.warn('[Forçar Leitura Entrada] Erro:', err);
    }
    setForcandoLeitura(false);
    setCodigoDigitadoManual(codigoBarras || '');
    setModalLeituraManualVisivel(true);
  };

  // FLUXO REAL: Consulta o backend AWS Lambda (/api/estoque -> verificar_produto)
  // que verifica o banco e consulta as 3 APIs de código de barras em cascata
  const processarCodigoBarras = async (eanInformado?: string) => {
    const ean = (eanInformado ?? codigoBarras).replace(/\D/g, '').trim();

    if (!ean || ean.length < 8 || ean.length > 14) {
      Alert.alert('Código de Barras Inválido', 'Informe ou escaneie um código EAN/GTIN válido entre 8 e 14 dígitos numéricos.');
      return;
    }

    setCodigoBarras(ean);
    setCarregandoVerificacao(true);
    setErrosCascataApis([]);
    setErroFotoRemota(false);

    try {
      const resp = await requisicaoApi<RespostaVerificacaoProduto>('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'verificar_produto', codigo_barras: ean },
      });

      if (!resp || !resp.sucesso) {
        throw new Error(resp?.mensagem || 'O servidor não conseguiu verificar o código de barras.');
      }

      if (resp.existe_no_banco && resp.produto) {
        // CENÁRIO A: PRODUTO JÁ EXISTE NO ESTOQUE DO BANCO DE DADOS
        const p = resp.produto;
        const categoriaResolvida = inferirCategoriaAlimento(p.nome_produto || '', p.categoria);
        const fotoRemota = (p.url_foto_produto || p.foto_url || '').trim();

        setIdProduto(p.id_produto || `prod_${ean}`);
        setNomeProduto(p.nome_produto || '');
        setMarcaProduto(p.marca_produto || '');
        setCategoria(categoriaResolvida);
        setUnidadeMedida(p.unidade_medida_pacote || 'pacotes');
        setEstoqueMinimo(String(p.estoque_minimo_pacote || 10));
        setUrlFotoProduto(fotoRemota);
        setOrigemDados(p.origem || 'Produto já cadastrado no estoque');
        setProdutoExistenteNoBanco(true);

        // Avança para a Etapa 3 para registrar o novo lote
        setEtapa(3);
        rolarParaAbaixo();
      } else if (resp.produto && (resp.produto.nome_produto || '').trim()) {
        // CENÁRIO B: PRODUTO NOVO ENCONTRADO NAS 3 APIS EXTERNAS EM CASCATA
        const p = resp.produto;
        const categoriaResolvida = inferirCategoriaAlimento(p.nome_produto, p.categoria);
        const fotoRemota = (p.url_foto_produto || p.foto_url || '').trim();
        const provedorLabel = p.origem || resp.provedor_utilizado || 'API de Código de Barras';

        setIdProduto(p.id_produto || `prod_${ean}`);
        setNomeProduto(p.nome_produto.trim());
        setMarcaProduto((p.marca_produto || '').trim());
        setCategoria(categoriaResolvida);
        setUnidadeMedida(p.unidade_medida_pacote || 'pacotes');
        setEstoqueMinimo(String(p.estoque_minimo_pacote || 10));
        setUrlFotoProduto(fotoRemota);
        setOrigemDados(`Localizado via ${provedorLabel}`);
        setProdutoExistenteNoBanco(false);

        // Abre a Etapa 2 para conferência dos dados retornados pela API antes do lote
        setEtapa(2);
        rolarParaAbaixo();
      } else {
        // CENÁRIO C: NÃO ENCONTRADO NAS 3 APIS EXTERNAS -> LIBERA PREENCHIMENTO MANUAL
        setIdProduto(`prod_${ean}`);
        setNomeProduto('');
        setMarcaProduto('');
        setCategoria('Grãos e Cereais');
        setUnidadeMedida('pacotes');
        setEstoqueMinimo('10');
        setUrlFotoProduto('');
        setOrigemDados('Não catalogado nas 3 APIs externas • Preenchimento manual');
        setErrosCascataApis(Array.isArray(resp.erros) ? resp.erros : []);
        setProdutoExistenteNoBanco(false);

        setEtapa(2);
        rolarParaAbaixo();

        Alert.alert(
          'Produto Não Catalogado nas APIs',
          resp.mensagem || 'O código de barras foi consultado nas 3 APIs em cascata, mas não consta nas bases públicas. Preencha os dados do alimento manualmente.'
        );
      }
    } catch (erro: any) {
      Alert.alert(
        'Erro ao Consultar Código de Barras',
        erro?.message || 'Não foi possível comunicar com o backend para consultar as APIs de código de barras. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregandoVerificacao(false);
    }
  };

  const validarDataReal = (dataStr: string): string | null => {
    return converterParaIso(dataStr);
  };

  const salvarLoteNoBackend = async () => {
    if (!nomeProduto.trim()) {
      Alert.alert('Produto Obrigatório', 'O nome descritivo do alimento é obrigatório.');
      return;
    }

    if (!numeroLote.trim()) {
      Alert.alert('Lote Obrigatório', 'Informe o número ou código impresso no lote.');
      return;
    }

    const qtd = Number(quantidadePacotes);
    if (!quantidadePacotes.trim() || isNaN(qtd) || qtd <= 0) {
      Alert.alert('Quantidade Inválida', 'Informe uma quantidade de pacotes maior que zero.');
      return;
    }

    const validadeIso = validarDataReal(dataValidade.trim());
    if (!validadeIso) {
      Alert.alert('Validade Inválida', 'Informe uma data de validade real no formato DD/MM/AAAA.');
      return;
    }

    if (estaVencido(dataValidade.trim())) {
      Alert.alert(
        'Bloqueio de Segurança — Produto Vencido',
        'Não é permitido cadastrar ou aceitar a entrada de produtos que já estejam com a data de validade vencida.',
      );
      return;
    }

    const nomebase = nomeProduto.trim();
    const marcaLimpa = marcaProduto.trim();
    const nomeCompleto =
      marcaLimpa && !nomebase.toLowerCase().includes(marcaLimpa.toLowerCase())
        ? `${nomebase} (${marcaLimpa})`
        : nomebase;

    const usuarioResponsavel =
      auth.currentUser?.email || auth.currentUser?.displayName || auth.currentUser?.uid || 'operador';

    const prateleiraResolvida = resolverPrateleiraPorDescricaoOuId(localArmazenamento);

    const payloadLote = {
      id_lote_produto: `lote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      id_produto: idProduto || `prod_${codigoBarras}`,
      nome_produto: nomeCompleto,
      marca_produto: marcaLimpa,
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
      id_local_armazenamento: prateleiraResolvida.id_local_armazenamento,
      local_descricao: prateleiraResolvida.local_descricao,
      url_foto_produto: urlFotoProduto,
      gravar_novo_produto: !produtoExistenteNoBanco,
      id_usuario: usuarioResponsavel,
    };

    setSalvando(true);
    try {
      const resp: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'cadastrar_lote',
          lote: payloadLote,
          id_usuario: usuarioResponsavel,
        },
      });

      if (resp?.sucesso) {
        setDadosResumo({
          nome_produto: nomeCompleto,
          marca_produto: marcaLimpa,
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
        setMensagemFeedback(resp.mensagem || 'Entrada gravada com sucesso no banco de dados!');
        setModalFeedbackVisivel(true);
      } else {
        setTipoFeedback('erro');
        setMensagemFeedback(resp?.mensagem || 'Não foi possível cadastrar o lote no servidor.');
        setModalFeedbackVisivel(true);
      }
    } catch (erro: any) {
      setTipoFeedback('erro');
      setMensagemFeedback(erro.message || 'Falha de comunicação com o servidor AWS.');
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

  const obterFonteImagemProduto = (urlRemota?: string, catNome?: string) => {
    if (urlRemota && urlRemota.trim().startsWith('http') && !erroFotoRemota) {
      return { uri: urlRemota.trim() };
    }
    return obterPlaceholderPorCategoria(catNome || categoria);
  };

  const renderBlocoCategorias = (permitirSelecionar: boolean) => {
    const categoriaAtualItem = categoriasItens.find((c) => c.nome === categoria);

    return (
      <View style={{ marginBottom: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 160 }}>
            <Text style={{ fontSize: 13 * fontScale, fontWeight: '800', color: theme.text }}>
              Categorias de Alimentos (DynamoDB)
            </Text>
            <Text style={{ fontSize: 11 * fontScale, color: theme.subtext, marginTop: 2 }}>
              {categoriasVisiveis.length} categoria(s) ativa(s) • toque para selecionar
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setModalNovaCategoriaVisivel(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Adicionar Nova Categoria"
            style={{
              minHeight: 48,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: '#10B981',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Feather name="plus-circle" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: 12.5 * fontScale, fontWeight: '800', color: '#FFFFFF' }}>
              Nova Categoria
            </Text>
          </TouchableOpacity>
        </View>

        {carregandoCategorias && categoriasParaExibir.length === 0 ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 10 }} />
        ) : (
          <View>
            <TouchableOpacity
              onPress={() => setDropdownCategoriasAberto((aberto) => !aberto)}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ expanded: dropdownCategoriasAberto }}
              accessibilityLabel={`Categoria selecionada: ${categoria || 'Nenhuma'}. Toque para abrir a lista suspensa de categorias`}
              activeOpacity={0.8}
              style={{
                minHeight: 50,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: dropdownCategoriasAberto ? '#1E3A8A' : '#CBD5E1',
                backgroundColor: dropdownCategoriasAberto ? '#EFF6FF' : '#F8FAFC',
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Feather name="tag" size={17} color="#1E3A8A" />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 14 * fontScale,
                    fontWeight: '700',
                    color: categoria ? '#1E3A8A' : theme.subtext,
                  }}
                >
                  {categoria || 'Selecione uma categoria...'}
                </Text>
                {categoriaAtualItem?.oculta && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 10 * fontScale, fontWeight: '700', color: '#475569' }}>
                      Oculta
                    </Text>
                  </View>
                )}
              </View>

              <Feather
                name={dropdownCategoriasAberto ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#1E3A8A"
              />
            </TouchableOpacity>

            {dropdownCategoriasAberto && (
              <View
                style={{
                  marginTop: 6,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#CBD5E1',
                  backgroundColor: '#FFFFFF',
                  overflow: 'hidden',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                }}
              >
                <ScrollView
                  nestedScrollEnabled={true}
                  style={{ maxHeight: 260 }}
                  showsVerticalScrollIndicator={true}
                >
                  {categoriasParaExibir.length === 0 ? (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12.5 * fontScale, color: theme.subtext }}>
                        Nenhuma categoria ativa disponível.
                      </Text>
                    </View>
                  ) : (
                    categoriasParaExibir.map((item, idx) => {
                      const selecionada = categoria === item.nome;
                      return (
                        <View
                          key={item.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            minHeight: 48,
                            backgroundColor: selecionada ? '#EFF6FF' : '#FFFFFF',
                            borderBottomWidth: idx < categoriasParaExibir.length - 1 ? 1 : 0,
                            borderBottomColor: '#F1F5F9',
                            opacity: item.oculta ? 0.65 : 1,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              if (permitirSelecionar || !item.oculta) {
                                setCategoria(item.nome);
                                setDropdownCategoriasAberto(false);
                              }
                            }}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selecionada }}
                            accessibilityLabel={`Categoria ${item.nome}`}
                            style={{
                              flex: 1,
                              minHeight: 48,
                              paddingHorizontal: 14,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <Feather
                              name={selecionada ? 'check-circle' : 'tag'}
                              size={16}
                              color={selecionada ? '#1E3A8A' : '#64748B'}
                            />
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 13.5 * fontScale,
                                fontWeight: selecionada ? '800' : '600',
                                color: selecionada ? '#1E3A8A' : theme.text,
                              }}
                            >
                              {item.nome}
                              {item.oculta ? ' (oculta)' : ''}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => lidarAlternarOcultarCategoria(item)}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={
                              item.oculta
                                ? `Reexibir categoria ${item.nome}`
                                : `Ocultar categoria ${item.nome}`
                            }
                            style={{
                              minWidth: 48,
                              minHeight: 48,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderLeftWidth: 1,
                              borderLeftColor: '#F1F5F9',
                            }}
                          >
                            <Feather
                              name={item.oculta ? 'eye' : 'eye-off'}
                              size={16}
                              color={item.oculta ? '#10B981' : '#94A3B8'}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {categoriasOcultas.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setMostrarCategoriasOcultas((v) => !v)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Mostrar ou esconder categorias ocultas"
                    style={{
                      minHeight: 48,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 14,
                      backgroundColor: '#F8FAFC',
                      borderTopWidth: 1,
                      borderTopColor: '#E2E8F0',
                    }}
                  >
                    <Feather
                      name={mostrarCategoriasOcultas ? 'eye' : 'eye-off'}
                      size={15}
                      color="#64748B"
                    />
                    <Text style={{ fontSize: 12 * fontScale, color: theme.subtext, fontWeight: '600' }}>
                      {mostrarCategoriasOcultas
                        ? 'Esconder categorias ocultas novamente'
                        : `${categoriasOcultas.length} categoria(s) oculta(s) • Toque para gerenciar`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
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
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
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
              Identificação do Código de Barras
            </Text>
          </View>

          <TouchableOpacity
            onPress={abrirScannerCamera}
            disabled={carregandoVerificacao}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Escanear código de barras usando a câmera"
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
            rotulo="Número do Código de Barras (EAN-8 a EAN-14):"
            placeholder="Digite os 8 a 14 dígitos do código"
            keyboardType="numeric"
            value={codigoBarras}
            onChangeText={lidarComMascaraEan}
          />

          <TouchableOpacity
            onPress={() => processarCodigoBarras()}
            disabled={carregandoVerificacao}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Consultar código de barras no estoque e nas APIs"
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 * fontScale }}>
                  Consultando Estoque e 3 APIs EAN...
                </Text>
              </View>
            ) : (
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 * fontScale }}>
                Consultar Código e Preencher ➔
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {etapa === 1 && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: '#E5E7EB',
              marginBottom: 16,
            }}
          >
            {renderBlocoCategorias(false)}
          </View>
        )}

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
              source={obterFonteImagemProduto(urlFotoProduto, categoria)}
              onError={() => setErroFotoRemota(true)}
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
                {categoria} • EAN: {codigoBarras}
              </Text>
            </View>
          </View>
        )}

        {/* CENÁRIO B / C: PRODUTO NOVO (Formulário preenchido pela API em cascata ou liberado para cadastro manual) */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Feather
                name={errosCascataApis.length > 0 ? 'edit-3' : 'zap'}
                size={18}
                color={errosCascataApis.length > 0 ? '#D97706' : '#10B981'}
                style={{ marginRight: 6 }}
              />
              <Text style={{ fontSize: 13.5 * fontScale, fontWeight: '700', color: theme.text, flex: 1 }}>
                {origemDados}
              </Text>
            </View>

            {errosCascataApis.length > 0 && (
              <View
                style={{
                  backgroundColor: '#FFFBEB',
                  borderColor: '#FDE68A',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 11 * fontScale, fontWeight: '700', color: '#92400E', marginBottom: 4 }}>
                  Retorno do Barramento em Cascata (EAN {codigoBarras}):
                </Text>
                {errosCascataApis.map((err, idx) => (
                  <Text key={idx} style={{ fontSize: 10.5 * fontScale, color: '#B45309' }}>
                    • {err}
                  </Text>
                ))}
              </View>
            )}

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
                source={obterFonteImagemProduto(urlFotoProduto, categoria)}
                onError={() => setErroFotoRemota(true)}
                style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#E5E7EB', marginRight: 12 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: theme.text }}>
                  Imagem de Identificação
                </Text>
                <Text style={{ fontSize: 11 * fontScale, color: '#6B7280', marginTop: 2 }}>
                  {urlFotoProduto && !erroFotoRemota
                    ? 'Foto oficial retornada pela API de código de barras.'
                    : `Ilustração institucional da categoria (${categoria}).`}
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
              placeholder="Ex: Italac / Camil"
              value={marcaProduto}
              onChangeText={setMarcaProduto}
            />

            {renderBlocoCategorias(true)}

            <AppNumericInput
              rotulo="Estoque mínimo de segurança *"
              placeholder="10"
              min={0}
              value={estoqueMinimo}
              onChangeText={lidarComMascaraEstoqueMinimo}
            />

            <TouchableOpacity
              onPress={() => {
                if (!nomeProduto.trim()) {
                  Alert.alert('Campo Obrigatório', 'Informe o nome do alimento antes de prosseguir.');
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

        {/* ETAPA 3: DADOS DO LOTE */}
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
                {produtoExistenteNoBanco ? '2. Adicionar Novo Lote ao Produto' : '3. Informações do Lote'}
              </Text>
            </View>

            <AppInput
              rotulo="Número ou Código do Lote *"
              placeholder="Digite o código impresso na embalagem"
              autoCapitalize="characters"
              value={numeroLote}
              onChangeText={setNumeroLote}
            />

            <AppNumericInput
              rotulo="Quantidade (pacotes) *"
              placeholder="0"
              min={0}
              value={quantidadePacotes}
              onChangeText={lidarComMascaraQuantidade}
            />

            <AppDateInput
              rotulo="Validade (DD/MM/AAAA) *"
              placeholder="DD/MM/AAAA"
              value={dataValidade}
              onChangeText={setDataValidade}
              bloquearDatasPassadas={true}
              mensagemAviso={
                validadeVencida
                  ? 'Bloqueio de segurança: produto vencido não pode ser aceito.'
                  : undefined
              }
            />

            {validadeVencida && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: '#FEF2F2',
                  borderColor: '#DC2626',
                  borderWidth: 1.5,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <Feather name="alert-octagon" size={20} color="#DC2626" />
                <Text style={{ flex: 1, color: '#991B1B', fontSize: 12 * fontScale, fontWeight: '700' }}>
                  Entrada Bloqueada: a data informada já está vencida. O sistema proíbe o cadastro e o aceite de lotes fora da validade.
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 13 * fontScale, fontWeight: '700', color: theme.text, marginBottom: 6, marginTop: 4 }}>
              Local de Armazenamento (Armário / Geladeira):
            </Text>

            {/* Card de Destaque com o Local Selecionado */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                borderColor: '#10B981',
                borderWidth: 1.5,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 12,
              }}
            >
              <Feather
                name={localArmazenamento.toLowerCase().includes('geladeira') ? 'thermometer' : 'archive'}
                size={18}
                color="#059669"
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10.5 * fontScale, color: '#047857', fontWeight: '600' }}>
                  Local Selecionado para este Lote:
                </Text>
                <Text style={{ fontSize: 13 * fontScale, color: '#065F46', fontWeight: '800' }}>
                  {localArmazenamento}
                </Text>
              </View>
              <Feather name="check-circle" size={18} color="#059669" />
            </View>

            {/* Abas Rápidas por Tipo: Todos, Armários, Geladeiras */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              {[
                { chave: 'TODOS', rotulo: `Todos (${parsedLocais.length})`, icon: 'layers' },
                { chave: 'armário', rotulo: `Armários (${parsedLocais.filter((l) => l.tipo === 'armário').length})`, icon: 'archive' },
                { chave: 'geladeira', rotulo: `Geladeiras (${parsedLocais.filter((l) => l.tipo === 'geladeira').length})`, icon: 'thermometer' },
              ].map((aba) => {
                const ativo = filtroTipoLocal === aba.chave;
                return (
                  <TouchableOpacity
                    key={aba.chave}
                    onPress={() => setFiltroTipoLocal(aba.chave as any)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 7,
                      paddingHorizontal: 4,
                      borderRadius: 8,
                      borderWidth: 1.2,
                      backgroundColor: ativo ? theme.primary : '#F9FAFB',
                      borderColor: ativo ? theme.primary : '#E5E7EB',
                    }}
                  >
                    <Feather
                      name={aba.icon as any}
                      size={12}
                      color={ativo ? '#FFFFFF' : theme.subtext}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 10.5 * fontScale,
                        fontWeight: ativo ? '700' : '500',
                        color: ativo ? '#FFFFFF' : theme.text,
                      }}
                    >
                      {aba.rotulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Campo de Busca Rápida de Prateleiras */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 7,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Feather name="search" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
              <TextInput
                style={{ flex: 1, fontSize: 12 * fontScale, color: theme.text, padding: 0 }}
                placeholder="Filtrar prateleira ou compartimento..."
                placeholderTextColor="#9CA3AF"
                value={buscaLocal}
                onChangeText={setBuscaLocal}
              />
              {buscaLocal.length > 0 && (
                <TouchableOpacity onPress={() => setBuscaLocal('')}>
                  <Feather name="x" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista Organizada em Blocos por Equipamento */}
            <View style={{ gap: 10, marginBottom: 16 }}>
              {Object.keys(gruposEquipamentos).length === 0 ? (
                <View style={{ padding: 14, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12 * fontScale, color: theme.subtext }}>
                    Nenhum compartimento encontrado para o filtro aplicado.
                  </Text>
                </View>
              ) : (
                Object.entries(gruposEquipamentos).map(([nomeEquip, compartimentos]) => {
                  const ehGeladeira = nomeEquip.toLowerCase().includes('geladeira');
                  return (
                    <View
                      key={nomeEquip}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: 12,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Feather
                          name={ehGeladeira ? 'thermometer' : 'archive'}
                          size={14}
                          color={ehGeladeira ? '#0284C7' : '#059669'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={{ fontSize: 12.5 * fontScale, fontWeight: '700', color: theme.text, flex: 1 }}>
                          {nomeEquip}
                        </Text>
                        <Text style={{ fontSize: 10.5 * fontScale, color: theme.subtext }}>
                          {compartimentos.length} compartimento(s)
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {compartimentos.map((item) => {
                          const selecionado = localArmazenamento === item.descricao;
                          return (
                            <TouchableOpacity
                              key={item.descricao}
                              onPress={() => setLocalArmazenamento(item.descricao)}
                              style={{
                                paddingVertical: 7,
                                paddingHorizontal: 10,
                                borderRadius: 8,
                                borderWidth: 1.5,
                                borderColor: selecionado ? '#10B981' : '#D1D5DB',
                                backgroundColor: selecionado ? '#10B981' : '#FFFFFF',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {selecionado && <Feather name="check" size={12} color="#FFFFFF" />}
                              <Text
                                style={{
                                  fontSize: 11.5 * fontScale,
                                  fontWeight: selecionado ? '700' : '500',
                                  color: selecionado ? '#FFFFFF' : theme.text,
                                }}
                              >
                                {item.compartimento}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {salvando ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 8 }} />
            ) : (
              <AppButton
                title={
                  validadeVencida
                    ? 'Entrada Bloqueada (Produto Vencido)'
                    : produtoExistenteNoBanco
                      ? 'Salvar Novo Lote'
                      : 'Cadastrar Produto e Lote'
                }
                variant={validadeVencida ? 'danger' : 'secondary'}
                disabled={validadeVencida}
                onPress={salvarLoteNoBackend}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL DO SCANNER DE CÓDIGO DE BARRAS POR CÂMERA REAL */}
      <Modal
        visible={modalCameraVisivel}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          leituraProcessadaRef.current = false;
          setLanternaAtiva(false);
          setModalCameraVisivel(false);
        }}
      >
        <SafeAreaView style={estilosCamera.container}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            autofocus="on"
            enableTorch={lanternaAtiva}
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code128',
                'code39',
                'itf14',
                'qr',
              ],
            }}
            onBarcodeScanned={aoLerCodigoCamera}
          />

          <View style={estilosCamera.topoBarra}>
            <TouchableOpacity
              onPress={() => {
                leituraProcessadaRef.current = false;
                setLanternaAtiva(false);
                setModalCameraVisivel(false);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Voltar para a tela de cadastro"
              style={estilosCamera.botaoVoltarCamera}
            >
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
              <Text style={estilosCamera.textoBotaoVoltarCamera}>Voltar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanternaAtiva((atual) => !atual)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Alternar lanterna"
              style={[
                estilosCamera.botaoControle,
                lanternaAtiva && { backgroundColor: '#F59E0B' },
              ]}
            >
              <Feather name="zap" size={20} color="#FFFFFF" />
              <Text style={estilosCamera.textoBotaoControle}>
                {lanternaAtiva ? 'Luz Ativa' : 'Lanterna'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={estilosCamera.areaMiraCentral}>
            <View style={estilosCamera.molduraScanner}>
              <Animated.View
                style={[
                  estilosCamera.laserLinha,
                  { transform: [{ translateY: animLaser }] },
                ]}
              />
            </View>
            <Text style={[estilosCamera.instrucaoScanner, { fontSize: 14 * fontScale }]}>
              Posicione o código de barras (EAN) da embalagem dentro do quadro
            </Text>
          </View>

          <View style={estilosCamera.rodape}>
            <TouchableOpacity
              onPress={handleForcarLeituraCadastro}
              disabled={forcandoLeitura}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Realizar Leitura do código de barras"
              style={estilosCamera.botaoRealizarLeitura}
              activeOpacity={0.8}
            >
              {forcandoLeitura ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="maximize-2" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={estilosCamera.textoBotaoRealizarLeitura}>Realizar Leitura</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCodigoDigitadoManual(codigoBarras || '');
                setModalLeituraManualVisivel(true);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Digitar código de barras manualmente"
              style={estilosCamera.botaoManualRapido}
              activeOpacity={0.8}
            >
              <Feather name="edit-3" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={estilosCamera.textoBotaoManualRapido}>Digitar Manualmente</Text>
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
        <View style={estilosCamera.modalOverlay}>
          <View style={[estilosCamera.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={{ fontSize: 16 * fontScale, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
              Informar Código de Barras (EAN)
            </Text>
            <Text style={{ fontSize: 12 * fontScale, color: theme.subtext, marginBottom: 14 }}>
              Digite os dígitos do código de barras da embalagem para dar andamento ao cadastro do produto:
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
                backgroundColor: theme.background,
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
                  aoLerCodigoCamera({ data: codigoDigitadoManual.trim() });
                }}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Adicionar Nova Categoria na AWS */}
      <Modal
        visible={modalNovaCategoriaVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalNovaCategoriaVisivel(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 20,
              borderWidth: 1.5,
              borderColor: theme.border,
              elevation: 5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: `${theme.primary}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Feather name="plus-circle" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16 * fontScale, fontWeight: '800', color: theme.text }}>
                  Nova Categoria de Alimento
                </Text>
                <Text style={{ fontSize: 11.5 * fontScale, color: theme.subtext }}>
                  Cadastrar no banco de dados AWS
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalNovaCategoriaVisivel(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar modal de nova categoria"
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <AppInput
              rotulo="Nome da Categoria *"
              placeholder="Ex: Frutas e Verduras, Padaria, Doces..."
              value={nomeNovaCategoria}
              onChangeText={setNomeNovaCategoria}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setModalNovaCategoriaVisivel(false)}
                disabled={salvandoCategoria}
                style={{
                  flex: 1,
                  minHeight: 48,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.subtext, fontWeight: '600', fontSize: 13 * fontScale }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={salvarNovaCategoriaNaAws}
                disabled={salvandoCategoria}
                style={{
                  flex: 1,
                  minHeight: 48,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: theme.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {salvandoCategoria ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 * fontScale }}>
                    Cadastrar na AWS
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação com Imagem e Resumo Real Gravado */}
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
                    source={obterFonteImagemProduto(dadosResumo.url_foto, dadosResumo.categoria)}
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

const estilosCamera = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  topoBarra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  botaoVoltarCamera: {
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
  textoBotaoVoltarCamera: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  botaoControle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.78)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    minHeight: 46,
    gap: 6,
  },
  textoBotaoControle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  areaMiraCentral: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  molduraScanner: {
    width: 280,
    height: 170,
    borderWidth: 2.5,
    borderColor: '#10B981',
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 8,
  },
  laserLinha: {
    width: '92%',
    height: 2.5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  instrucaoScanner: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 18,
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
    backgroundColor: '#10B981',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  },
  botaoManual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  textoBotaoManual: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

