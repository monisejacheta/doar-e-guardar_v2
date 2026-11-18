import AsyncStorage from '@react-native-async-storage/async-storage';
import { requisicaoApi } from './api';
import { converterIsoParaBr, converterParaIso, formatarDataDDMMAAAA } from '../utils/dateValidation';

export interface DoadorRegistro {
  id: string;
  nome_completo: string;
  tipo: 'PF' | 'PJ';
  documento: string;
  telefone: string;
  email: string;
  data_cadastro: string; // DD/MM/AAAA
  observacoes: string;
  status_ativo: boolean;
}

export interface InstituicaoRegistro {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  tipo_unidade: string;
  endereco: string;
  telefone: string;
  responsavel: string;
  data_fundacao: string; // DD/MM/AAAA
  status_ativo: boolean;
}

const CHAVE_DOADORES = '@dg_doadores_crud_v1';
const CHAVE_INSTITUICOES = '@dg_instituicoes_crud_v1';

async function lerStorage<T>(chave: string): Promise<T[] | null> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function gravarStorage<T>(chave: string, lista: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    // Silencioso
  }
}

function normalizarDoadorServidor(raw: any): DoadorRegistro {
  const tipoRaw = String(raw.tipo || 'PF').toUpperCase();
  return {
    id: String(raw.id_doador || raw.id || `doador_${Date.now()}`),
    nome_completo: String(raw.nome_completo || raw.nome_completo_doador || raw.nome || 'Doador').trim(),
    tipo: tipoRaw === 'PJ' ? 'PJ' : 'PF',
    documento: String(raw.documento || raw.cpf_doador || raw.cpf_cnpj || ''),
    telefone: String(raw.telefone || raw.telefone_doador || ''),
    email: String(raw.email || raw.email_doador || ''),
    data_cadastro:
      converterIsoParaBr(String(raw.data_cadastro || '')) || formatarDataDDMMAAAA(new Date()),
    observacoes: String(raw.observacoes || raw.endereco || raw.regime || ''),
    status_ativo: raw.status_ativo !== false,
  };
}

function normalizarInstituicaoServidor(raw: any): InstituicaoRegistro {
  return {
    id: String(raw.id_instituicao || raw.id || `inst_${Date.now()}`),
    nome_fantasia: String(raw.nome_fantasia || raw.nome_instituicao || raw.nome || 'Instituição').trim(),
    razao_social: String(raw.razao_social || raw.nome_fantasia || raw.nome_instituicao || raw.nome || ''),
    cnpj: String(raw.cnpj || raw.cnpj_instituicao || ''),
    tipo_unidade: String(raw.tipo_unidade || 'Unidade Parceira'),
    endereco: String(raw.endereco || ''),
    telefone: String(raw.telefone || ''),
    responsavel: String(raw.responsavel || ''),
    data_fundacao:
      converterIsoParaBr(String(raw.data_fundacao || '')) || formatarDataDDMMAAAA(new Date()),
    status_ativo: raw.status_ativo !== false,
  };
}

async function requisitarConfiguracoesAws(acao: string, payload: Record<string, any>) {
  let ultimoErro: any = null;
  for (const [rota, modulo] of [
    ['/api/configuracoes', 'configuracoes'],
    ['/api/estoque', 'estoque'],
  ] as const) {
    try {
      const res: any = await requisicaoApi(rota, {
        metodo: 'POST',
        dados: { modulo, acao, ...payload },
        timeoutMs: 8000,
      });
      if (res?.sucesso) return res;
      ultimoErro = new Error(res?.mensagem || 'Falha ao sincronizar com a AWS.');
    } catch (err: any) {
      ultimoErro = err;
    }
  }
  throw ultimoErro || new Error('Não foi possível conectar com o servidor AWS.');
}

// ==========================================
// CRUD DOADORES (SINCRONIZADO COM AWS)
// ==========================================
export async function listarDoadores(): Promise<DoadorRegistro[]> {
  try {
    const resp = await requisitarConfiguracoesAws('consultar_doadores', {});
    const listaBruta = Array.isArray(resp.doadores) ? resp.doadores : [];
    const mapeados = listaBruta.map(normalizarDoadorServidor);
    await gravarStorage(CHAVE_DOADORES, mapeados);
    return mapeados;
  } catch {
    const local = await lerStorage<DoadorRegistro>(CHAVE_DOADORES);
    return local ?? [];
  }
}

export async function salvarDoador(
  item: Omit<DoadorRegistro, 'id'> & { id?: string },
): Promise<DoadorRegistro[]> {
  const atuais = (await lerStorage<DoadorRegistro>(CHAVE_DOADORES)) ?? [];
  const ehEdicao = Boolean(item.id && atuais.some((d) => d.id === item.id));
  const idFinal = item.id || `doador_${Date.now()}`;
  const registro: DoadorRegistro = { ...item, id: idFinal };

  await requisitarConfiguracoesAws(ehEdicao ? 'atualizar_doador' : 'cadastrar_doador', {
    id_doador: idFinal,
    ...registro,
    data_cadastro: converterParaIso(registro.data_cadastro) || registro.data_cadastro,
  });

  const atualizados = ehEdicao
    ? atuais.map((d) => (d.id === idFinal ? registro : d))
    : [registro, ...atuais];

  await gravarStorage(CHAVE_DOADORES, atualizados);
  return atualizados;
}

export async function excluirDoador(id: string): Promise<DoadorRegistro[]> {
  await requisitarConfiguracoesAws('excluir_doador', { id_doador: id });
  const atuais = (await lerStorage<DoadorRegistro>(CHAVE_DOADORES)) ?? [];
  const atualizados = atuais.filter((d) => d.id !== id);
  await gravarStorage(CHAVE_DOADORES, atualizados);
  return atualizados;
}

// ==========================================
// CRUD INSTITUIÇÕES (SINCRONIZADO COM AWS)
// ==========================================
export async function listarInstituicoes(): Promise<InstituicaoRegistro[]> {
  try {
    const resp = await requisitarConfiguracoesAws('consultar_instituicoes', {});
    const listaBruta = Array.isArray(resp.instituicoes) ? resp.instituicoes : [];
    const mapeadas = listaBruta.map(normalizarInstituicaoServidor);
    await gravarStorage(CHAVE_INSTITUICOES, mapeadas);
    return mapeadas;
  } catch {
    const local = await lerStorage<InstituicaoRegistro>(CHAVE_INSTITUICOES);
    return local ?? [];
  }
}

export async function salvarInstituicao(
  item: Omit<InstituicaoRegistro, 'id'> & { id?: string },
): Promise<InstituicaoRegistro[]> {
  const atuais = (await lerStorage<InstituicaoRegistro>(CHAVE_INSTITUICOES)) ?? [];
  const ehEdicao = Boolean(item.id && atuais.some((i) => i.id === item.id));
  const idFinal = item.id || `inst_${Date.now()}`;
  const registro: InstituicaoRegistro = { ...item, id: idFinal };

  await requisitarConfiguracoesAws(ehEdicao ? 'atualizar_instituicao' : 'cadastrar_instituicao', {
    id_instituicao: idFinal,
    ...registro,
    data_fundacao: converterParaIso(registro.data_fundacao) || registro.data_fundacao,
  });

  const atualizadas = ehEdicao
    ? atuais.map((i) => (i.id === idFinal ? registro : i))
    : [registro, ...atuais];

  await gravarStorage(CHAVE_INSTITUICOES, atualizadas);
  return atualizadas;
}

export async function excluirInstituicao(id: string): Promise<InstituicaoRegistro[]> {
  await requisitarConfiguracoesAws('excluir_instituicao', { id_instituicao: id });
  const atuais = (await lerStorage<InstituicaoRegistro>(CHAVE_INSTITUICOES)) ?? [];
  const atualizadas = atuais.filter((i) => i.id !== id);
  await gravarStorage(CHAVE_INSTITUICOES, atualizadas);
  return atualizadas;
}
