import * as apiModule from '../../services/api';
import {
  cadastrarPrateleiraAws,
  carregarPrateleirasAws,
  decomporDescricaoPrateleira,
  excluirPrateleiraAws,
  gerarIdLocalCanonico,
  mesmaPrateleira,
  normalizarDescricaoPrateleira,
  resolverPrateleiraPorDescricaoOuId,
  sanitizarLoteParaAws,
} from '../../services/storageLocations';

describe('services/storageLocations.ts', () => {
  it('deve normalizar nomes e comparar prateleiras equivalentes', () => {
    expect(normalizarDescricaoPrateleira('Armário A - Prat. 1')).toBe('Armário A - Prateleira 1');
    expect(normalizarDescricaoPrateleira('Geladeira 1 - Prat. Central')).toBe(
      'Geladeira 1 - Prateleira Central'
    );
    expect(normalizarDescricaoPrateleira('Despensa Prateleira 2')).toBe(
      'Armário Despensa - Prateleira 2'
    );
    expect(normalizarDescricaoPrateleira('')).toBe('Armário A - Prateleira 1');

    expect(mesmaPrateleira('Armário A - Prat. 1', 'Armário A - Prateleira 1')).toBe(true);
    expect(mesmaPrateleira('Armário A - Prateleira 1', 'Geladeira 1 - Prateleira Central')).toBe(
      false
    );
    expect(gerarIdLocalCanonico('Geladeira 1', 'Prateleira Central')).toBe(
      'loc_geladeira_1_prateleira_central'
    );
  });

  it('deve sanitizar campos exclusivos de UI e decompor descrições', () => {
    const sanitizado = sanitizarLoteParaAws({
      id_lote_produto: 'l1',
      data_ms: 123,
      local_descricao_original: 'x',
      tipo_local: 'armário',
      eh_transferencia_interna: true,
      local_origem: 'A',
    });
    expect(sanitizado).toEqual({ id_lote_produto: 'l1' });

    const gel = decomporDescricaoPrateleira('Geladeira 2 - Gaveta Inferior');
    expect(gel.tipo_local).toBe('geladeira');
    expect(resolverPrateleiraPorDescricaoOuId('Geladeira 2 - Gaveta Inferior').tipo_local).toBe(
      'geladeira'
    );
  });

  it('deve carregar e reconciliar prateleiras da AWS e contabilizar ocupação', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi');
    spyApi.mockResolvedValueOnce({
      sucesso: true,
      locais: [
        {
          id_local_armazenamento: 'loc_armario_a_prateleira_1',
          local_descricao: 'Armário A - Prateleira 1',
          tipo_local: 'armário',
        },
      ],
    });

    const res = await carregarPrateleirasAws([
      {
        id_lote_produto: 'l1',
        local_descricao: 'Armário A - Prat. 1',
        id_local_armazenamento: 'loc_arm',
        quantidade_atual_pacote: 10,
      },
    ]);

    expect(res.locais).toHaveLength(1);
    expect(res.locais[0].quantidade_pacotes_alocados).toBe(10);
    expect(res.discrepanciasCorrigidas).toBe(1);
    spyApi.mockRestore();
  });

  it('deve bloquear ruas/corredores ao cadastrar e bloquear exclusão de prateleira ocupada', async () => {
    const corredor = await cadastrarPrateleiraAws({
      nome_local: 'Corredor 1',
      tipo_local: 'armário',
      sublocal_compartimento: 'Rua B',
    });
    expect(corredor.sucesso).toBe(false);

    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValueOnce({
      sucesso: true,
      local: { id_local_armazenamento: 'loc_armario_c_prateleira_1' },
    });
    const cad = await cadastrarPrateleiraAws({
      nome_local: 'Armário C',
      tipo_local: 'armário',
      sublocal_compartimento: 'Prateleira 1',
    });
    expect(cad.sucesso).toBe(true);

    const ocupada = await excluirPrateleiraAws({
      ...(cad.local as any),
      quantidade_lotes_ativos: 1,
      quantidade_pacotes_alocados: 5,
    });
    expect(ocupada.sucesso).toBe(false);

    spyApi.mockResolvedValueOnce({ sucesso: true });
    const vazia = await excluirPrateleiraAws(cad.local as any);
    expect(vazia.sucesso).toBe(true);
    spyApi.mockRestore();
  });
});
