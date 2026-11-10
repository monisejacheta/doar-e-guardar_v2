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
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';
import { auth } from '../services/firebaseConfig';
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
  tentativas_apis?: Array<{ api: string; status: string; origem?: string }>;
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
  const leituraProcessadaRef = useRef(false);
  const animLaser = useRef(new Animated.Value(0)).current;

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
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_INSTITUCIONAIS);
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

  // Carrega categorias de alimentos já cadastradas na AWS
  const carregarCategoriasDoBackend = useCallback(async () => {
    try {
      const resp: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'listar_categorias' },
      });
      if (resp?.sucesso && Array.isArray(resp.categorias) && resp.categorias.length > 0) {
        const nomesServidor: string[] = resp.categorias
          .map((c: any) => (typeof c === 'string' ? c : c.nome_categoria || c.nome))
          .filter(Boolean);

        setCategorias((atuais) => {
          const conjunto = new Set([...atuais, ...nomesServidor]);
          return Array.from(conjunto);
        });
      }
    } catch {
      // Mantém categorias iniciais
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
      const resp: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'cadastrar_categoria',
          nome_categoria: nomeLimpo,
        },
      });

      setCategorias((atuais) => {
        if (!atuais.includes(nomeLimpo)) {
          return [...atuais, nomeLimpo];
        }
        return atuais;
      });
      setCategoria(nomeLimpo);
      setNomeNovaCategoria('');
      setModalNovaCategoriaVisivel(false);
      Alert.alert('Sucesso', resp?.mensagem || `Categoria "${nomeLimpo}" cadastrada na AWS com sucesso!`);
    } catch (err: any) {
      setCategorias((atuais) => {
        if (!atuais.includes(nomeLimpo)) {
          return [...atuais, nomeLimpo];
        }
        return atuais;
      });
      setCategoria(nomeLimpo);
      setNomeNovaCategoria('');
      setModalNovaCategoriaVisivel(false);
      Alert.alert('Categoria Cadastrada', `Categoria "${nomeLimpo}" adicionada e selecionada.`);
    } finally {
      setSalvandoCategoria(false);
    }
  };

  useEffect(() => {
    carregarLocaisDoBackend();
    carregarCategoriasDoBackend();
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

  const abrirScannerGoogleNativo = async () => {
    try {
      if (CameraView.launchScanner) {
        leituraProcessadaRef.current = false;
        const sub = CameraView.onModernBarcodeScanned((event) => {
          sub?.remove();
          aoLerCodigoCamera(event);
        });
        await CameraView.launchScanner({
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14', 'qr'],
        });
      }
    } catch (err: any) {
      console.warn('Google Code Scanner não disponível:', err);
      Alert.alert('Google Scanner', 'Utilize o visor da câmera com foco automático integrado.');
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

    // Retorna para a tela de cadastro com o número do código de barras preenchido no campo
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
    if (!dataStr || dataStr.length !== 10) return null;
    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;
    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const ano = Number(partes[2]);
    if (isNaN(dia) || isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 2020 || ano > 2100) {
      return null;
    }
    const iso = `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const dt = new Date(`${iso}T00:00:00`);
    if (isNaN(dt.getTime()) || dt.getUTCMonth() + 1 !== mes || dt.getUTCDate() !== dia) {
      return null;
    }
    return iso;
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

            <Text style={{ fontSize: 12 * fontScale, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
              Categoria do Alimento:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {categorias.map((cat) => {
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

              {/* Botão Adicionar Categoria no mesmo formato e tamanho */}
              <TouchableOpacity
                onPress={() => setModalNovaCategoriaVisivel(true)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}0D`,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Feather name="plus" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                <Text
                  style={{
                    fontSize: 12 * fontScale,
                    fontWeight: '700',
                    color: theme.primary,
                  }}
                >
                  Adicionar Categoria
                </Text>
              </TouchableOpacity>
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

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  rotulo="Quantidade (pacotes) *"
                  placeholder="0"
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
                title={produtoExistenteNoBanco ? '✔ Salvar Novo Lote' : '✔ Cadastrar Produto e Lote'}
                variant="secondary"
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
            onBarcodeScanned={leituraProcessadaRef.current ? undefined : aoLerCodigoCamera}
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
              accessibilityLabel="Fechar câmera"
              style={estilosCamera.botaoControle}
            >
              <Feather name="x" size={22} color="#FFFFFF" />
              <Text style={estilosCamera.textoBotaoControle}>Fechar</Text>
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

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              {Platform.OS === 'android' && (
                <TouchableOpacity
                  onPress={abrirScannerGoogleNativo}
                  style={estilosCamera.botaoManual}
                >
                  <Feather name="maximize-2" size={18} color="#10B981" />
                  <Text style={estilosCamera.textoBotaoManual}>Google Code Scanner</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setModalCameraVisivel(false);
                  setEtapa(1);
                }}
                style={[estilosCamera.botaoManual, { borderColor: '#6B7280' }]}
              >
                <Feather name="edit-3" size={18} color="#FFFFFF" />
                <Text style={estilosCamera.textoBotaoManual}>Digitar Código</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
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
              <TouchableOpacity onPress={() => setModalNovaCategoriaVisivel(false)}>
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

