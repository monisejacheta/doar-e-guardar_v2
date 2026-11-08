import {
  sanitizarLoteParaAws,
  normalizarDescricaoPrateleira,
  gerarIdLocalCanonico,
  decomporDescricaoPrateleira,
  mesmaPrateleira,
  resolverPrateleiraPorDescricaoOuId,
  carregarPrateleirasAws,
  cadastrarPrateleiraAws,
  excluirPrateleiraAws,
  LOCAIS_HOMOLOGADOS_PADRAO,
} from '../../services/storageLocations';
import * as apiModule from '../../services/api';

jest.mock('../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Serviço de Locais de Armazenamento (storageLocations.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve sanitizar campos exclusivos do mobile antes de enviar para a AWS', () => {
    const loteBruto = {
      id_lote_produto: 'lote_1',
      nome_produto: 'Arroz 5kg',
      data_ms: 123456,
      local_descricao_original: 'Armário A',
      tipo_local: 'armário',
      eh_transferencia_interna: true,
      local_origem: 'Armário B',
    };

    const limpo = sanitizarLoteParaAws(loteBruto);
    expect(limpo).toEqual({
      id_lote_produto: 'lote_1',
      nome_produto: 'Arroz 5kg',
    });
  });

  it('deve normalizar descrições históricas de prateleiras corretamente', () => {
    expect(normalizarDescricaoPrateleira('Armário A - Prat. 1')).toBe('Armário A - Prateleira 1');
    expect(normalizarDescricaoPrateleira('Geladeira 1 Prateleira Central')).toBe('Geladeira 1 - Prateleira Central');
    expect(normalizarDescricaoPrateleira('Despensa Prateleira 2')).toBe('Armário Despensa - Prateleira 2');
    expect(normalizarDescricaoPrateleira('')).toBe('Armário A - Prateleira 1');
  });

  it('deve gerar ID canônico e decompor descrição de prateleira', () => {
    expect(gerarIdLocalCanonico('Armário A', 'Prateleira 1')).toBe('loc_armario_a_prateleira_1');
    const decomp = decomporDescricaoPrateleira('Geladeira 1 - Gaveta Superior');
    expect(decomp.tipo_local).toBe('geladeira');
    expect(decomp.localizacao_ambiente).toBe('Cozinha Institucional');
  });

  it('deve comparar e resolver prateleiras por descrição ou ID', () => {
    expect(mesmaPrateleira('Armário A - Prat. 1', 'armario a - prateleira 1')).toBe(true);
    expect(mesmaPrateleira('Armário A - Prateleira 1', 'Armário B - Prateleira 1')).toBe(false);

    const resolvido = resolverPrateleiraPorDescricaoOuId('loc_armario_a_prateleira_1', LOCAIS_HOMOLOGADOS_PADRAO);
    expect(resolvido.local_descricao).toBe('Armário A - Prateleira 1');
  });

  it('deve carregar prateleiras da AWS e normalizar lotes ativos', async () => {
    const resultado = await carregarPrateleirasAws([
      {
        id_lote_produto: 'l1',
        nome_produto: 'Arroz',
        quantidade_atual_pacote: 10,
        local_descricao: 'Armário A - Prat. 1',
      },
    ]);

    expect(resultado.locais.length).toBeGreaterThanOrEqual(7);
    expect(resultado.lotesNormalizados[0].local_descricao).toBe('Armário A - Prateleira 1');
    expect(resultado.discrepanciasCorrigidas).toBeGreaterThanOrEqual(1);
  });

  it('deve validar regras da US06 ao cadastrar e excluir prateleiras', async () => {
    const erroRua = await cadastrarPrateleiraAws({
      nome_local: 'Corredor 1',
      tipo_local: 'armário',
      sublocal_compartimento: 'Prateleira 1',
    });
    expect(erroRua.sucesso).toBe(false);

    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({ sucesso: true });
    const sucesso = await cadastrarPrateleiraAws({
      nome_local: 'Armário C',
      tipo_local: 'armário',
      sublocal_compartimento: 'Prateleira 1',
    });
    expect(sucesso.sucesso).toBe(true);
    expect(sucesso.local?.local_descricao).toBe('Armário C - Prateleira 1');

    const bloqueioExclusao = await excluirPrateleiraAws({
      ...sucesso.local!,
      quantidade_lotes_ativos: 1,
      quantidade_pacotes_alocados: 5,
    });
    expect(bloqueioExclusao.sucesso).toBe(false);

    const exclusaoOk = await excluirPrateleiraAws({
      ...sucesso.local!,
      quantidade_lotes_ativos: 0,
      quantidade_pacotes_alocados: 0,
    });
    expect(exclusaoOk.sucesso).toBe(true);
  });
});
