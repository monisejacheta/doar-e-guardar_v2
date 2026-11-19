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

/**
 * Carrega exclusivamente as categorias armazenadas na tabela tb_categoriasAlimentos (AWS DynamoDB).
 */
export async function carregarCategoriasComEstado(): Promise<{
  categorias: CategoriaAlimentoItem[];
  origemServidor: boolean;
}> {
  const ocultasLocal = await lerListaStorage(CHAVE_CATEGORIAS_OCULTAS);

  for (const [rota, modulo] of [
    ['/api/configuracoes', 'configuracoes'],
    ['/api/estoque', 'estoque'],
  ] as const) {
    try {
      const resp: any = await requisicaoApi(rota, {
        metodo: 'POST',
        dados: { modulo, acao: 'listar_categorias' },
        timeoutMs: 8000,
      });

      if (resp?.sucesso && Array.isArray(resp.categorias)) {
        const mapa = new Map<string, CategoriaAlimentoItem>();
        for (const item of resp.categorias) {
          if (typeof item === 'string') {
            const nome = normalizarNomeCategoria(item);
            if (!nome) continue;
            const key = chaveComparacao(nome);
            if (!mapa.has(key)) {
              mapa.set(key, { id: key, nome, oculta: false, origem: 'dynamodb' });
            }
          } else if (item && typeof item === 'object') {
            const nome = normalizarNomeCategoria(item.nome_categoria || item.nome || item.categoria || '');
            if (!nome) continue;
            const key = chaveComparacao(nome);
            if (!mapa.has(key)) {
              mapa.set(key, {
                id: String(item.id_categoria_alimento || key),
                nome,
                oculta: item.oculta === true || item.ativo === false || item.status_ativo === false,
                origem: 'dynamodb',
              });
            }
          }
        }

        const lista = Array.from(mapa.values());
        await salvarListaStorage(CHAVE_CACHE_CATEGORIAS, lista.map((c) => c.nome));
        await salvarListaStorage(
          CHAVE_CATEGORIAS_OCULTAS,
          lista.filter((c) => c.oculta).map((c) => c.nome),
        );
        return { categorias: lista, origemServidor: true };
      }
    } catch {
      // Tenta rota seguinte
    }
  }

  // Fallback offline apenas se a AWS estiver inacessível
  const cacheNomes = await lerListaStorage(CHAVE_CACHE_CATEGORIAS);
  const mapaOcultas = new Set<string>(ocultasLocal.map((n) => chaveComparacao(n)));
  return {
    categorias: cacheNomes.map((nome, idx) => {
      const key = chaveComparacao(nome);
      return {
        id: `${key}-${idx}`,
        nome,
        oculta: mapaOcultas.has(key),
        origem: 'local',
      };
    }),
    origemServidor: false,
  };
}

/**
 * Cria e persiste uma nova categoria exclusivamente na tabela tb_categoriasAlimentos (AWS DynamoDB).
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

  for (const [rota, modulo] of [
    ['/api/configuracoes', 'configuracoes'],
    ['/api/estoque', 'estoque'],
  ] as const) {
    try {
      const resp: any = await requisicaoApi(rota, {
        metodo: 'POST',
        dados: {
          modulo,
          acao: 'cadastrar_categoria',
          nome_categoria: nomeFinal,
        },
        timeoutMs: 8000,
      });
      if (resp?.sucesso) {
        const atuais = await lerListaStorage(CHAVE_CACHE_CATEGORIAS);
        if (!atuais.some((n) => chaveComparacao(n) === chaveComparacao(nomeFinal))) {
          await salvarListaStorage(CHAVE_CACHE_CATEGORIAS, [nomeFinal, ...atuais]);
        }
        return {
          sucesso: true,
          nomeFinal,
          sincronizadaAws: true,
        };
      }
    } catch {
      // Tenta próxima rota
    }
  }

  return {
    sucesso: false,
    nomeFinal,
    sincronizadaAws: false,
    mensagem: 'Não foi possível salvar a categoria na tabela tb_categoriasAlimentos da AWS.',
  };
}

/**
 * Alterna a visibilidade (ocultar/exibir) de uma categoria na tabela tb_categoriasAlimentos (AWS).
 */
export async function alternarVisibilidadeCategoria(
  nomeCategoria: string,
  ocultar: boolean,
): Promise<void> {
  const nomeLimpo = normalizarNomeCategoria(nomeCategoria);
  const keyAlvo = chaveComparacao(nomeLimpo);
  const atuais = await lerListaStorage(CHAVE_CATEGORIAS_OCULTAS);

  const novas = ocultar
    ? Array.from(new Set([...atuais, nomeLimpo]))
    : atuais.filter((item) => chaveComparacao(item) !== keyAlvo);
  await salvarListaStorage(CHAVE_CATEGORIAS_OCULTAS, novas);

  for (const [rota, modulo] of [
    ['/api/configuracoes', 'configuracoes'],
    ['/api/estoque', 'estoque'],
  ] as const) {
    try {
      const resp: any = await requisicaoApi(rota, {
        metodo: 'POST',
        dados: {
          modulo,
          acao: 'atualizar_visibilidade_categoria',
          nome_categoria: nomeLimpo,
          oculta: ocultar,
        },
        timeoutMs: 5000,
      });
      if (resp?.sucesso) return;
    } catch {
      // Tenta rota seguinte
    }
  }
}
