import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiModule from '../../services/api';
import {
  excluirDoador,
  excluirInstituicao,
  listarDoadores,
  listarInstituicoes,
  salvarDoador,
  salvarInstituicao,
} from '../../services/entitiesCrudService';

describe('services/entitiesCrudService.ts', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('deve listar, salvar, editar e excluir doadores sincronizados com AWS', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi');
    spyApi.mockResolvedValueOnce({
      sucesso: true,
      doadores: [
        {
          id_doador: 'd1',
          nome_completo_doador: 'João Silva',
          cpf_doador: '123.456.789-00',
          email_doador: 'joao@teste.org',
          telefone_doador: '19999999999',
        },
      ],
    });

    const lista = await listarDoadores();
    expect(lista).toHaveLength(1);
    expect(lista[0].nome_completo).toBe('João Silva');

    spyApi.mockResolvedValueOnce({ sucesso: true });
    const atualizados = await salvarDoador({
      nome_completo: 'Maria Oliveira',
      tipo: 'PF',
      documento: '111.222.333-44',
      telefone: '19988887777',
      email: 'maria@teste.org',
      data_cadastro: '20/11/2026',
      observacoes: 'Doadora mensal',
      status_ativo: true,
    });
    expect(atualizados.some((d) => d.nome_completo === 'Maria Oliveira')).toBe(true);

    spyApi.mockResolvedValueOnce({ sucesso: true });
    const aposExclusao = await excluirDoador('d1');
    expect(aposExclusao.some((d) => d.id === 'd1')).toBe(false);
    spyApi.mockRestore();
  });

  it('deve listar, salvar e excluir instituições sincronizadas com AWS', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi');
    spyApi.mockResolvedValueOnce({
      sucesso: true,
      instituicoes: [
        {
          id_instituicao: 'inst_1',
          nome_instituicao: 'Casa da Criança Itapira',
          cnpj_instituicao: '12.345.678/0001-99',
        },
      ],
    });

    const lista = await listarInstituicoes();
    expect(lista).toHaveLength(1);

    spyApi.mockResolvedValueOnce({ sucesso: true });
    const aposSalvar = await salvarInstituicao({
      nome_fantasia: 'Creche Esperança',
      razao_social: 'Creche Esperança LTDA',
      cnpj: '98.765.432/0001-10',
      tipo_unidade: 'Parceira',
      endereco: 'Rua das Flores, 10',
      telefone: '1938630000',
      responsavel: 'Ana',
      data_fundacao: '01/05/2010',
      status_ativo: true,
    });
    expect(aposSalvar.some((i) => i.nome_fantasia === 'Creche Esperança')).toBe(true);

    spyApi.mockResolvedValueOnce({ sucesso: true });
    const aposExcluir = await excluirInstituicao('inst_1');
    expect(aposExcluir.some((i) => i.id === 'inst_1')).toBe(false);
    spyApi.mockRestore();
  });
});
