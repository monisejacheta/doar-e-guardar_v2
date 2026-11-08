import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import ReportsStockScreen from '../../../app/reports-stock';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Relatório de Estoque Atual (src/app/reports-stock.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l_st_1',
          codigo_barra_produto: '7891234567890',
          nome_produto: 'Feijão Carioca 1kg',
          categoria: 'Grãos',
          quantidade_atual_pacote: 30,
          estoque_minimo_pacote: 10,
          data_validade_lote: '2027-05-01',
          local_descricao: 'Armário A - Prateleira 2',
        },
      ],
    });
  });

  it('deve exibir o balanço por categorias e a listagem consolidada de estoque atual', async () => {
    const { getByText } = await renderWithTheme(<ReportsStockScreen />);

    await waitFor(() => {
      expect(getByText('Relatório de Estoque Atual')).toBeTruthy();
      expect(getByText('Balanço por Categorias')).toBeTruthy();
      expect(getByText('Feijão Carioca 1kg')).toBeTruthy();
    });
  });
});
