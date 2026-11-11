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

const DOADORES_INICIAIS: DoadorRegistro[] = [
  {
    id: 'doador_padrao_1',
    nome_completo: 'Doador Pessoa Física',
    tipo: 'PF',
    documento: '',
    telefone: '(11) 99999-0001',
    email: 'doador.pf@casadacrianca.org.br',
    data_cadastro: '10/01/2026',
    observacoes: 'Doações avulsas com aceite LGPD ativo.',
    status_ativo: true,
  },
  {
    id: 'doador_padrao_2',
    nome_completo: 'Supermercado Parceiro Central',
    tipo: 'PJ',
    documento: '12.345.678/0001-90',
    telefone: '(11) 3333-4000',
    email: 'parceria@supercentral.com.br',
    data_cadastro: '01/02/2026',
    observacoes: 'Coleta semanal de alimentos e hortifrúti.',
    status_ativo: true,
  },
];

const INSTITUICOES_INICIAIS: InstituicaoRegistro[] = [
  {
    id: 'inst_padrao_1',
    nome_fantasia: 'Casa da Criança - Matriz',
    razao_social: 'Instituto Social Casa da Criança',
    cnpj: '45.678.901/0001-12',
    tipo_unidade: 'Sede Principal',
    endereco: 'Rua da Esperança, 120 - Centro',
    telefone: '(11) 4002-8922',
    responsavel: 'Coordenação Geral',
    data_fundacao: '15/05/2018',
    status_ativo: true,
  },
  {
    id: 'inst_padrao_2',
    nome_fantasia: 'Casa da Criança - Unidade B',
    razao_social: 'Núcleo Educacional Casa da Criança II',
    cnpj: '45.678.901/0002-01',
    tipo_unidade: 'Unidade Escolar',
    endereco: 'Av. das Flores, 450 - Jardim Paulista',
    telefone: '(11) 4002-8930',
    responsavel: 'Nutrição e Cozinha',
    data_fundacao: '10/03/2021',
    status_ativo: true,
  },
];

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
    nome_completo: String(raw.nome_completo || raw.nome || 'Doador').trim(),
    tipo: tipoRaw === 'PJ' ? 'PJ' : 'PF',
    documento: String(raw.documento || raw.cpf_cnpj || ''),
    telefone: String(raw.telefone || ''),
    email: String(raw.email || ''),
    data_cadastro:
      converterIsoParaBr(String(raw.data_cadastro || '')) || formatarDataDDMMAAAA(new Date()),
    observacoes: String(raw.observacoes || raw.regime || ''),
    status_ativo: raw.status_ativo !== false,
  };
}

function normalizarInstituicaoServidor(raw: any): InstituicaoRegistro {
  return {
    id: String(raw.id_instituicao || raw.id || `inst_${Date.now()}`),
    nome_fantasia: String(raw.nome_fantasia || raw.nome || 'Instituição').trim(),
    razao_social: String(raw.razao_social || raw.nome_fantasia || raw.nome || ''),
    cnpj: String(raw.cnpj || ''),
    tipo_unidade: String(raw.tipo_unidade || 'Unidade Parceira'),
    endereco: String(raw.endereco || ''),
    telefone: String(raw.telefone || ''),
    responsavel: String(raw.responsavel || ''),
    data_fundacao:
      converterIsoParaBr(String(raw.data_fundacao || '')) || formatarDataDDMMAAAA(new Date()),
    status_ativo: raw.status_ativo !== false,
  };
}

async function tentarRequisicaoDual(acao: string, payload: Record<string, any>) {
  for (const [rota, modulo] of [
    ['/api/configuracoes', 'configuracoes'],
    ['/api/estoque', 'estoque'],
  ] as const) {
    try {
      const res: any = await requisicaoApi(rota, {
        metodo: 'POST',
        dados: { modulo, acao, ...payload },
        timeoutMs: 6000,
      });
      if (res?.sucesso) return res;
    } catch {
      // Tenta rota seguinte
    }
  }
  return null;
}

// ==========================================
// CRUD DOADORES
// ==========================================
export async function listarDoadores(): Promise<DoadorRegistro[]> {
  const local = await lerStorage<DoadorRegistro>(CHAVE_DOADORES);
  if (local !== null) return local;

  const resp = await tentarRequisicaoDual('consultar_doadores', {});
  if (resp && Array.isArray(resp.doadores) && resp.doadores.length > 0) {
    const mapeados = resp.doadores.map(normalizarDoadorServidor);
    await gravarStorage(CHAVE_DOADORES, mapeados);
    return mapeados;
  }

  await gravarStorage(CHAVE_DOADORES, DOADORES_INICIAIS);
  return DOADORES_INICIAIS;
}

export async function salvarDoador(
  item: Omit<DoadorRegistro, 'id'> & { id?: string },
): Promise<DoadorRegistro[]> {
  const atuais = await listarDoadores();
  const ehEdicao = Boolean(item.id && atuais.some((d) => d.id === item.id));
  const idFinal = item.id || `doador_${Date.now()}`;
  const registro: DoadorRegistro = { ...item, id: idFinal };

  const atualizados = ehEdicao
    ? atuais.map((d) => (d.id === idFinal ? registro : d))
    : [registro, ...atuais];

  await gravarStorage(CHAVE_DOADORES, atualizados);

  await tentarRequisicaoDual(ehEdicao ? 'atualizar_doador' : 'cadastrar_doador', {
    id_doador: idFinal,
    ...registro,
    data_cadastro: converterParaIso(registro.data_cadastro) || registro.data_cadastro,
  });

  return atualizados;
}

export async function excluirDoador(id: string): Promise<DoadorRegistro[]> {
  const atuais = await listarDoadores();
  const atualizados = atuais.filter((d) => d.id !== id);
  await gravarStorage(CHAVE_DOADORES, atualizados);
  await tentarRequisicaoDual('excluir_doador', { id_doador: id });
  return atualizados;
}

// ==========================================
// CRUD INSTITUIÇÕES
// ==========================================
export async function listarInstituicoes(): Promise<InstituicaoRegistro[]> {
  const local = await lerStorage<InstituicaoRegistro>(CHAVE_INSTITUICOES);
  if (local !== null) return local;

  const resp = await tentarRequisicaoDual('consultar_instituicoes', {});
  if (resp && Array.isArray(resp.instituicoes) && resp.instituicoes.length > 0) {
    const mapeadas = resp.instituicoes.map(normalizarInstituicaoServidor);
    await gravarStorage(CHAVE_INSTITUICOES, mapeadas);
    return mapeadas;
  }

  await gravarStorage(CHAVE_INSTITUICOES, INSTITUICOES_INICIAIS);
  return INSTITUICOES_INICIAIS;
}

export async function salvarInstituicao(
  item: Omit<InstituicaoRegistro, 'id'> & { id?: string },
): Promise<InstituicaoRegistro[]> {
  const atuais = await listarInstituicoes();
  const ehEdicao = Boolean(item.id && atuais.some((i) => i.id === item.id));
  const idFinal = item.id || `inst_${Date.now()}`;
  const registro: InstituicaoRegistro = { ...item, id: idFinal };

  const atualizadas = ehEdicao
    ? atuais.map((i) => (i.id === idFinal ? registro : i))
    : [registro, ...atuais];

  await gravarStorage(CHAVE_INSTITUICOES, atualizadas);

  await tentarRequisicaoDual(ehEdicao ? 'atualizar_instituicao' : 'cadastrar_instituicao', {
    id_instituicao: idFinal,
    ...registro,
    data_fundacao: converterParaIso(registro.data_fundacao) || registro.data_fundacao,
  });

  return atualizadas;
}

export async function excluirInstituicao(id: string): Promise<InstituicaoRegistro[]> {
  const atuais = await listarInstituicoes();
  const atualizadas = atuais.filter((i) => i.id !== id);
  await gravarStorage(CHAVE_INSTITUICOES, atualizadas);
  await tentarRequisicaoDual('excluir_instituicao', { id_instituicao: id });
  return atualizadas;
}
