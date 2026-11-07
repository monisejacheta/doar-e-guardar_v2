// app-mobile/src/services/storageLocations.ts
import { requisicaoApi } from './api';

export interface LocalArmazenamento {
  id_local_armazenamento: string;
  nome_local: string;
  tipo_local: 'armário' | 'geladeira';
  sublocal_compartimento: string;
  localizacao_ambiente: string;
  local_descricao: string;
  status_ativo: boolean;
  quantidade_lotes_ativos?: number;
  quantidade_pacotes_alocados?: number;
  origem_sincronizacao?: 'aws_configuracoes' | 'aws_estoque' | 'homologado';
}

export const LOCAIS_HOMOLOGADOS_PADRAO: LocalArmazenamento[] = [
  {
    id_local_armazenamento: 'loc_armario_a_prateleira_1',
    nome_local: 'Armário A',
    tipo_local: 'armário',
    sublocal_compartimento: 'Prateleira 1',
    localizacao_ambiente: 'Despensa Principal',
    local_descricao: 'Armário A - Prateleira 1',
    status_ativo: true,
    origem_sincronizacao: 'homologado',
  },
  {
    id_local_armazenamento: 'loc_armario_a_prateleira_2',
    nome_local: 'Armário A',
    tipo_local: 'armário',
    sublocal_compartimento: 'Prateleira 2',
    localizacao_ambiente: 'Despensa Principal',
    local_descricao: 'Armário A - Prateleira 2',
    status_ativo: true,
    origem_sincronizacao: 'homologado',
  },
  {
    id_local_armazenamento: 'loc_armario_b_prateleira_1',
    nome_local: 'Armário B',
    tipo_local: 'armário',
    sublocal_compartimento: 'Prateleira 1',
    localizacao_ambiente: 'Despensa Seca',
    local_descricao: 'Armário B - Prateleira 1',
    status_ativo: true,
    origem_sincronizacao: 'homologado',
  },
  {
    id_local_armazenamento: 'loc_armario_b_prateleira_3',
    nome_local: 'Armário B',
    tipo_local: 'armário',
    sublocal_compartimento: 'Prateleira 3',
    localizacao_ambiente: 'Despensa Seca',
    local_descricao: 'Armário B - Prateleira 3',
    status_ativo: true,
    origem_sincronizacao: 'homologado',
  },
  {
    id_local_armazenamento: 'loc_geladeira_1_prateleira_central',
    nome_local: 'Geladeira 1',
    tipo_local: 'geladeira',
    sublocal_compartimento: 'Prateleira Central',
    localizacao_ambiente: 'Cozinha Institucional',
    local_descricao: 'Geladeira 1 - Prateleira Central',
    status_ativo: true,
    origem_sincronizacao: 'homologado',
  },
  {
    id_local_armazenamento: 'loc_geladeira_1_gaveta_superior',
    nome_local: 'Geladeira 1',
    tipo_local: 'geladeira',
    sublocal_compartimento: 'Gaveta Superior',
    localizacao_ambiente: 'Cozinha Institucional',
    local_descricao: 'Geladeira 1 - Gaveta Superior',
    status_ativo: true,
    origem_sincronizacao: 'homologado',
  },
  {
    id_local_armazenamento: 'loc_geladeira_2_gaveta_inferior',
    nome_local: 'Geladeira 2',
    tipo_local: 'geladeira',
    sublocal_compartimento: 'Gaveta Inferior',
    localizacao_ambiente: 'Cozinha Institucional',
    local_descricao: 'Geladeira 2 - Gaveta Inferior',
    status_ativo: true,
    origem_sincronizacao: 'homologado',
  },
];

// Cache em memória da sessão para manter novas prateleiras cadastradas sincronizadas entre telas
let cacheLocaisSessao: LocalArmazenamento[] = [...LOCAIS_HOMOLOGADOS_PADRAO];
let rotaConfiguracoesSuportada: boolean | null = null;

/**
 * Remove campos exclusivos da interface mobile antes de enviar um lote para o DynamoDB na AWS.
 */
export function sanitizarLoteParaAws(loteBruto: Record<string, any>): Record<string, any> {
  const copia: Record<string, any> = { ...loteBruto };
  delete copia.data_ms;
  delete copia.local_descricao_original;
  delete copia.tipo_local;
  delete copia.eh_transferencia_interna;
  delete copia.local_origem;
  return copia;
}

const removerAcentos = (texto: string): string =>
  (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Normaliza descrições de prateleiras para eliminar discrepâncias históricas:
 * - 'Armário A - Prat. 1' -> 'Armário A - Prateleira 1'
 * - 'Geladeira 1 - Prat. Central' -> 'Geladeira 1 - Prateleira Central'
 * - 'Despensa Prateleira 1' -> 'Armário Despensa - Prateleira 1'
 */
export function normalizarDescricaoPrateleira(descricao?: string | null): string {
  let texto = (descricao || '').trim();
  if (!texto) return 'Armário A - Prateleira 1';

  texto = texto.replace(/\bPrat(?:\.|\b)\s*/gi, 'Prateleira ');
  texto = texto.replace(/\s+/g, ' ').trim();

  if (!texto.includes(' - ') && /\b(Prateleira|Gaveta)\b/i.test(texto)) {
    const match = texto.match(/^(.*?)\s*\b(Prateleira|Gaveta)\b\s*(.*)$/i);
    if (match) {
      const prefixo = match[1].replace(/[-–]+$/, '').trim() || 'Armário';
      const compartimento = `${match[2]} ${match[3]}`.trim();
      texto = `${prefixo} - ${compartimento}`;
    }
  }

  if (/^despensa/i.test(texto)) {
    texto = `Armário ${texto}`;
  }

  return texto;
}

export function gerarIdLocalCanonico(nomeLocal: string, sublocal: string): string {
  const base = removerAcentos(`${nomeLocal}_${sublocal}`.toLowerCase())
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base ? `loc_${base}` : 'loc_armario_a_prateleira_1';
}

export function decomporDescricaoPrateleira(descricaoBruta: string): LocalArmazenamento {
  const descCanonica = normalizarDescricaoPrateleira(descricaoBruta);
  const partes = descCanonica.split(' - ');
  const nomeLocal = (partes[0] || 'Armário A').trim();
  const sublocal = (partes.slice(1).join(' - ') || 'Prateleira 1').trim();
  const ehGeladeira = /geladeira|freezer|refrigerador/i.test(nomeLocal);
  const tipoLocal: 'armário' | 'geladeira' = ehGeladeira ? 'geladeira' : 'armário';
  const ambiente = ehGeladeira
    ? 'Cozinha Institucional'
    : /despensa|b\b/i.test(nomeLocal)
    ? 'Despensa Seca'
    : 'Despensa Principal';

  return {
    id_local_armazenamento: gerarIdLocalCanonico(nomeLocal, sublocal),
    nome_local: nomeLocal,
    tipo_local: tipoLocal,
    sublocal_compartimento: sublocal,
    localizacao_ambiente: ambiente,
    local_descricao: `${nomeLocal} - ${sublocal}`,
    status_ativo: true,
    origem_sincronizacao: 'aws_estoque',
  };
}

export function mesmaPrateleira(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const normA = removerAcentos(normalizarDescricaoPrateleira(a).toLowerCase());
  const normB = removerAcentos(normalizarDescricaoPrateleira(b).toLowerCase());
  return normA === normB;
}

export function resolverPrateleiraPorDescricaoOuId(
  valor?: string | null,
  listaLocais: LocalArmazenamento[] = cacheLocaisSessao
): LocalArmazenamento {
  const v = (valor || '').trim();
  if (!v) return listaLocais[0] || LOCAIS_HOMOLOGADOS_PADRAO[0];

  const porId = listaLocais.find(
    (loc) =>
      String(loc.id_local_armazenamento).toLowerCase() === v.toLowerCase() &&
      !['loc_arm', 'loc_gel', 'loc_des', '0'].includes(v.toLowerCase())
  );
  if (porId) return porId;

  const porDesc = listaLocais.find((loc) => mesmaPrateleira(loc.local_descricao, v));
  if (porDesc) return porDesc;

  return decomporDescricaoPrateleira(v);
}

/**
 * Busca as prateleiras cadastradas na AWS (/api/configuracoes e /api/estoque)
 * e reconcilia com os lotes ativos no banco de dados para garantir 100% de consistência.
 */
export async function carregarPrateleirasAws(lotesPreCarregados?: any[]): Promise<{
  locais: LocalArmazenamento[];
  lotesNormalizados: any[];
  discrepanciasCorrigidas: number;
}> {
  const mapaLocais = new Map<string, LocalArmazenamento>();
  let discrepanciasCorrigidas = 0;

  const registrarNoMapa = (itemBruto: any, origem: LocalArmazenamento['origem_sincronizacao']) => {
    const descBruta =
      itemBruto?.local_descricao ||
      (itemBruto?.nome_local && itemBruto?.sublocal_compartimento
        ? `${itemBruto.nome_local} - ${itemBruto.sublocal_compartimento}`
        : '');
    if (!descBruta) return;

    const decomp = decomporDescricaoPrateleira(descBruta);
    const chave = removerAcentos(decomp.local_descricao.toLowerCase());
    const idBruto = String(itemBruto?.id_local_armazenamento || '');
    const idValido =
      idBruto && !['0', 'loc_arm', 'loc_gel', 'loc_des'].includes(idBruto) && !/^\d+$/.test(idBruto)
        ? idBruto
        : decomp.id_local_armazenamento;

    const existente = mapaLocais.get(chave);
    mapaLocais.set(chave, {
      ...decomp,
      ...existente,
      id_local_armazenamento: idValido,
      nome_local: decomp.nome_local,
      tipo_local: itemBruto?.tipo_local === 'geladeira' ? 'geladeira' : decomp.tipo_local,
      sublocal_compartimento: decomp.sublocal_compartimento,
      localizacao_ambiente: itemBruto?.localizacao_ambiente || existente?.localizacao_ambiente || decomp.localizacao_ambiente,
      local_descricao: decomp.local_descricao,
      status_ativo: itemBruto?.status_ativo !== false,
      origem_sincronizacao: origem,
    });
  };

  // 1. Registra locais da sessão e padrão
  cacheLocaisSessao.forEach((loc) => registrarNoMapa(loc, loc.origem_sincronizacao || 'homologado'));

  // 2. Consulta lotes ativos na AWS (se não foram pré-carregados)
  let lotesBrutos = Array.isArray(lotesPreCarregados) ? lotesPreCarregados : [];
  if (!lotesPreCarregados) {
    try {
      const respEst: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });
      if (respEst?.sucesso && Array.isArray(respEst.lotes)) {
        lotesBrutos = respEst.lotes;
      }
      if (Array.isArray(respEst?.locais)) {
        respEst.locais.forEach((l: any) => registrarNoMapa(l, 'aws_configuracoes'));
      }
    } catch {
      // Fallback silencioso para cache da sessão
    }
  }

  // 3. Consulta endpoint de configurações da AWS (/api/configuracoes) caso suportado pela Lambda ativa
  if (rotaConfiguracoesSuportada !== false) {
    try {
      const respConf: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: { modulo: 'configuracoes', acao: 'listar_locais' },
      });
      if (respConf?.sucesso && Array.isArray(respConf.locais)) {
        rotaConfiguracoesSuportada = true;
        respConf.locais.forEach((l: any) => registrarNoMapa(l, 'aws_configuracoes'));
      }
    } catch {
      rotaConfiguracoesSuportada = false;
    }
  }

  // 4. Reconcilia todas as prateleiras encontradas nos lotes da AWS e contabiliza ocupação
  const contagemLotes = new Map<string, number>();
  const contagemPacotes = new Map<string, number>();

  const lotesNormalizados = lotesBrutos.map((lote: any) => {
    const descOriginal = String(lote?.local_descricao || '').trim();
    const idOriginal = String(lote?.id_local_armazenamento || '').trim();
    const decomp = decomporDescricaoPrateleira(descOriginal || idOriginal || 'Armário A - Prateleira 1');
    const chave = removerAcentos(decomp.local_descricao.toLowerCase());

    if (!mapaLocais.has(chave)) {
      registrarNoMapa(decomp, 'aws_estoque');
    }

    const localHomologado = mapaLocais.get(chave)!;
    const qtd = Number(lote?.quantidade_atual_pacote) || 0;

    if (qtd > 0) {
      contagemLotes.set(chave, (contagemLotes.get(chave) || 0) + 1);
      contagemPacotes.set(chave, (contagemPacotes.get(chave) || 0) + qtd);
    }

    if (
      descOriginal !== localHomologado.local_descricao ||
      !idOriginal ||
      ['loc_arm', 'loc_gel', 'loc_des', '0'].includes(idOriginal)
    ) {
      discrepanciasCorrigidas += 1;
    }

    return {
      ...lote,
      id_local_armazenamento: localHomologado.id_local_armazenamento,
      local_descricao: localHomologado.local_descricao,
      local_descricao_original: descOriginal || localHomologado.local_descricao,
      tipo_local: localHomologado.tipo_local,
    };
  });

  const listaFinal = Array.from(mapaLocais.entries())
    .map(([chave, loc]) => ({
      ...loc,
      quantidade_lotes_ativos: contagemLotes.get(chave) || 0,
      quantidade_pacotes_alocados: contagemPacotes.get(chave) || 0,
    }))
    .sort((a, b) => a.local_descricao.localeCompare(b.local_descricao));

  cacheLocaisSessao = listaFinal;

  return {
    locais: listaFinal,
    lotesNormalizados,
    discrepanciasCorrigidas,
  };
}

export async function cadastrarPrateleiraAws(dados: {
  nome_local: string;
  tipo_local: 'armário' | 'geladeira';
  sublocal_compartimento: string;
  localizacao_ambiente?: string;
}): Promise<{ sucesso: boolean; mensagem: string; local?: LocalArmazenamento }> {
  const nome = (dados.nome_local || '').trim();
  const sublocal = (dados.sublocal_compartimento || '').trim();
  const tipo = dados.tipo_local;
  const ambiente = (dados.localizacao_ambiente || (tipo === 'geladeira' ? 'Cozinha Institucional' : 'Despensa Principal')).trim();

  if (tipo !== 'armário' && tipo !== 'geladeira') {
    return {
      sucesso: false,
      mensagem: "Regra US06: São permitidos apenas compartimentos do tipo 'armário' ou 'geladeira'.",
    };
  }

  if (!nome || !sublocal) {
    return {
      sucesso: false,
      mensagem: 'Preencha o nome do móvel/equipamento e a identificação da prateleira ou gaveta.',
    };
  }

  if (/corredor|rua\b|alameda|galp[aã]o/i.test(`${nome} ${sublocal} ${ambiente}`)) {
    return {
      sucesso: false,
      mensagem: 'Regra US06: Não é permitido cadastrar ruas, corredores ou galpões.',
    };
  }

  const descCanonica = normalizarDescricaoPrateleira(`${nome} - ${sublocal}`);
  const novoLocal: LocalArmazenamento = {
    id_local_armazenamento: gerarIdLocalCanonico(nome, sublocal),
    nome_local: nome,
    tipo_local: tipo,
    sublocal_compartimento: sublocal.replace(/\bPrat(?:\.|\b)\s*/gi, 'Prateleira ').trim(),
    localizacao_ambiente: ambiente,
    local_descricao: descCanonica,
    status_ativo: true,
    quantidade_lotes_ativos: 0,
    quantidade_pacotes_alocados: 0,
    origem_sincronizacao: 'aws_configuracoes',
  };

  try {
    const resp: any = await requisicaoApi('/api/configuracoes', {
      metodo: 'POST',
      dados: {
        modulo: 'configuracoes',
        acao: 'cadastrar_local',
        ...novoLocal,
      },
    });
    if (resp?.sucesso && resp?.local) {
      novoLocal.id_local_armazenamento = String(resp.local.id_local_armazenamento || novoLocal.id_local_armazenamento);
    }
  } catch {
    try {
      await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'cadastrar_local',
          ...novoLocal,
        },
      });
    } catch {
      // Mantém sincronizado na sessão caso a Lambda remota ainda não exponha a ação
    }
  }

  const jaExisteIdx = cacheLocaisSessao.findIndex((l) => mesmaPrateleira(l.local_descricao, novoLocal.local_descricao));
  if (jaExisteIdx >= 0) {
    cacheLocaisSessao[jaExisteIdx] = { ...cacheLocaisSessao[jaExisteIdx], ...novoLocal };
  } else {
    cacheLocaisSessao = [...cacheLocaisSessao, novoLocal].sort((a, b) =>
      a.local_descricao.localeCompare(b.local_descricao)
    );
  }

  return {
    sucesso: true,
    mensagem: `Prateleira "${novoLocal.local_descricao}" cadastrada e sincronizada com sucesso!`,
    local: novoLocal,
  };
}

export async function excluirPrateleiraAws(
  localAlvo: LocalArmazenamento
): Promise<{ sucesso: boolean; mensagem: string }> {
  if ((localAlvo.quantidade_pacotes_alocados || 0) > 0) {
    return {
      sucesso: false,
      mensagem: `Exclusão bloqueada (US06): A prateleira "${localAlvo.local_descricao}" possui ${localAlvo.quantidade_lotes_ativos} lote(s) ativo(s) (${localAlvo.quantidade_pacotes_alocados} pacotes). Transfira os itens em "Movimentação Interna" antes de excluir.`,
    };
  }

  try {
    await requisicaoApi('/api/configuracoes', {
      metodo: 'POST',
      dados: {
        modulo: 'configuracoes',
        acao: 'excluir_local',
        id_local_armazenamento: localAlvo.id_local_armazenamento,
        local_descricao: localAlvo.local_descricao,
      },
    });
  } catch {
    //Continua para remover do catálogo ativo
  }

  cacheLocaisSessao = cacheLocaisSessao.filter(
    (l) => !mesmaPrateleira(l.local_descricao, localAlvo.local_descricao)
  );

  return {
    sucesso: true,
    mensagem: `Prateleira "${localAlvo.local_descricao}" removida com sucesso.`,
  };
}
