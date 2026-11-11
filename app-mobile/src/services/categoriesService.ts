import AsyncStorage from '@react-native-async-storage/async-storage';
import { requisicaoApi } from './api';

export interface CategoriaAlimentoItem {
  id: string;
  nome: string;
  oculta: boolean;
  origem: 'dynamodb' | 'local';
}

export const CATEGORIAS_PADRAO_SISTEMA = [
  'Grãos e Cereais',
  'Laticínios',
  'Massas',
  'Enlatados',
  'Óleos e Gorduras',
  'Higiene e Limpeza',
];

const CHAVE_CACHE_CATEGORIAS = '@dg_categorias_alimentos_v2';
const CHAVE_CATEGORIAS_OCULTAS = '@dg_categorias_ocultas_v2';

function normalizarNomeCategoria(nome: string): string {
  return String(nome || '').trim().replace(/\s+/g, ' ');
}

function chaveComparacao(nome: string): string {
  return normalizarNomeCategoria(nome)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function lerListaStorage(chave: string): Promise<string[]> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed)
      ? parsed.map((x) => normalizarNomeCategoria(String(x))).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

async function salvarListaStorage(chave: string, lista: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    // Falha silenciosa de storage local
  }
}

function deduplicarNomes(nomes: string[]): string[] {
  const mapa = new Map<string, string>();
  for (const raw of nomes) {
    const limpo = normalizarNomeCategoria(raw);
    if (!limpo) continue;
    const key = chaveComparacao(limpo);
    if (!mapa.has(key)) {
      mapa.set(key, limpo);
    }
  }
  return Array.from(mapa.values());
}

/**
 * Carrega todas as categorias de alimentos registradas no DynamoDB (/api/estoque -> listar_categorias
 * e fallback /api/configuracoes) combinadas com cache local e estado de categorias ocultas.
 */
export async function carregarCategoriasComEstado(): Promise<{
  categorias: CategoriaAlimentoItem[];
  origemServidor: boolean;
}> {
  const [locais, ocultasLocal] = await Promise.all([
    lerListaStorage(CHAVE_CACHE_CATEGORIAS),
    lerListaStorage(CHAVE_CATEGORIAS_OCULTAS),
  ]);

  let nomesServidor: string[] = [];
  const ocultasServidor: string[] = [];
  let origemServidor = false;

  // Tenta carregar de /api/estoque (action: listar_categorias)
  try {
    const resp: any = await requisicaoApi('/api/estoque', {
      metodo: 'POST',
      dados: { modulo: 'estoque', acao: 'listar_categorias' },
      timeoutMs: 8000,
    });

    if (resp?.sucesso && Array.isArray(resp.categorias)) {
      origemServidor = true;
      for (const item of resp.categorias) {
        if (typeof item === 'string') {
          nomesServidor.push(item);
        } else if (item && typeof item === 'object') {
          const nome = item.nome_categoria || item.nome || item.categoria;
          if (nome) {
            nomesServidor.push(String(nome));
            if (item.oculta === true || item.ativo === false) {
              ocultasServidor.push(String(nome));
            }
          }
        }
      }
    }
  } catch {
    // Fallback para configuracoes / estoque abaixo
  }

  // Também consulta /api/configuracoes caso o backend esteja expondo listar_categorias por lá
  if (nomesServidor.length === 0) {
    try {
      const respCfg: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: { modulo: 'configuracoes', acao: 'listar_categorias' },
        timeoutMs: 6000,
      });
      if (respCfg?.sucesso && Array.isArray(respCfg.categorias)) {
        origemServidor = true;
        for (const item of respCfg.categorias) {
          const nome =
            typeof item === 'string'
              ? item
              : item?.nome_categoria || item?.nome || item?.categoria;
          if (nome) nomesServidor.push(String(nome));
        }
      }
    } catch {
      // Silencioso
    }
  }

  // Fallback adicional: extrai categorias distintas já usadas nos produtos do estoque AWS
  try {
    const respEst: any = await requisicaoApi('/api/estoque', {
      metodo: 'POST',
      dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      timeoutMs: 6000,
    });
    const listaLotes = Array.isArray(respEst?.dados)
      ? respEst.dados
      : Array.isArray(respEst?.lotes)
        ? respEst.lotes
        : [];
    for (const lote of listaLotes) {
      if (lote?.categoria) {
        nomesServidor.push(String(lote.categoria));
        origemServidor = true;
      }
    }
  } catch {
    // Mantém lista conhecida
  }

  const todosNomes = deduplicarNomes([
    ...nomesServidor,
    ...locais,
    ...CATEGORIAS_PADRAO_SISTEMA,
  ]);

  await salvarListaStorage(CHAVE_CACHE_CATEGORIAS, todosNomes);

  const mapaOcultas = new Set<string>(
    [...ocultasLocal, ...ocultasServidor].map((n) => chaveComparacao(n)),
  );
  const conjuntoServidor = new Set<string>(nomesServidor.map((n) => chaveComparacao(n)));

  const categorias: CategoriaAlimentoItem[] = todosNomes.map((nome, indice) => {
    const key = chaveComparacao(nome);
    return {
      id: `${key}-${indice}`,
      nome,
      oculta: mapaOcultas.has(key),
      origem: conjuntoServidor.has(key) ? 'dynamodb' : 'local',
    };
  });

  return { categorias, origemServidor };
}

/**
 * Cria e persiste uma nova categoria tanto localmente quanto no AWS DynamoDB.
 */
export async function criarEPersistirCategoria(nomeBruto: string): Promise<{
  sucesso: boolean;
  nomeFinal: string;
  sincronizadaAws: boolean;
  mensagem?: string;
}> {
  const nomeFinal = normalizarNomeCategoria(nomeBruto);
  if (nomeFinal.length < 2) {
    return {
      sucesso: false,
      nomeFinal,
      sincronizadaAws: false,
      mensagem: 'Informe ao menos 2 caracteres para a nova categoria.',
    };
  }

  // Salva imediatamente no cache local e garante que não esteja oculta
  const atuais = await lerListaStorage(CHAVE_CACHE_CATEGORIAS);
  const atualizadas = deduplicarNomes([nomeFinal, ...atuais]);
  await salvarListaStorage(CHAVE_CACHE_CATEGORIAS, atualizadas);

  const ocultasAtuais = await lerListaStorage(CHAVE_CATEGORIAS_OCULTAS);
  const ocultasFiltradas = ocultasAtuais.filter(
    (item) => chaveComparacao(item) !== chaveComparacao(nomeFinal),
  );
  await salvarListaStorage(CHAVE_CATEGORIAS_OCULTAS, ocultasFiltradas);

  let sincronizadaAws = false;

  try {
    const respEst: any = await requisicaoApi('/api/estoque', {
      metodo: 'POST',
      dados: {
        modulo: 'estoque',
        acao: 'cadastrar_categoria',
        nome_categoria: nomeFinal,
      },
      timeoutMs: 8000,
    });
    if (respEst?.sucesso) sincronizadaAws = true;
  } catch {
    // Tenta rota alternativa de configurações
  }

  if (!sincronizadaAws) {
    try {
      const respCfg: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: {
          modulo: 'configuracoes',
          acao: 'cadastrar_categoria',
          nome_categoria: nomeFinal,
        },
        timeoutMs: 8000,
      });
      if (respCfg?.sucesso) sincronizadaAws = true;
    } catch {
      // Mantém persistência local garantida
    }
  }

  return {
    sucesso: true,
    nomeFinal,
    sincronizadaAws,
  };
}

/**
 * Alterna a visibilidade (ocultar/exibir) de uma categoria específica com persistência local + AWS opcional.
 */
export async function alternarVisibilidadeCategoria(
  nomeCategoria: string,
  ocultar: boolean,
): Promise<void> {
  const nomeLimpo = normalizarNomeCategoria(nomeCategoria);
  const keyAlvo = chaveComparacao(nomeLimpo);
  const atuais = await lerListaStorage(CHAVE_CATEGORIAS_OCULTAS);

  let novas: string[];
  if (ocultar) {
    novas = deduplicarNomes([...atuais, nomeLimpo]);
  } else {
    novas = atuais.filter((item) => chaveComparacao(item) !== keyAlvo);
  }
  await salvarListaStorage(CHAVE_CATEGORIAS_OCULTAS, novas);

  try {
    await requisicaoApi('/api/estoque', {
      metodo: 'POST',
      dados: {
        modulo: 'estoque',
        acao: 'atualizar_visibilidade_categoria',
        nome_categoria: nomeLimpo,
        oculta: ocultar,
      },
      timeoutMs: 5000,
    });
  } catch {
    // Estado local já atualizado com sucesso
  }
}
