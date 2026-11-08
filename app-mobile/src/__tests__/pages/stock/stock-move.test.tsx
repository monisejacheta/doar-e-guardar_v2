import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import StockMoveScreen from '../../../app/stock-move';
import { mockRouter } from '../../setup';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Movimentação Interna de Estoque (src/app/stock-move.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l_mov_1',
          id_produto: 'p_mov_1',
          nome_produto: 'Macarrão Espaguete 500g',
          categoria: 'Massas',
          codigo_barra_produto: '7895556667778',
          numero_codigo_lote: 'LT-MAC-01',
          quantidade_atual_pacote: 12,
          data_validade_lote: '2027-08-01',
          local_descricao: 'Armário A - Prateleira 1',
        },
      ],
    });
  });

  it('deve exibir produtos por prateleira e navegar para gerenciamento de prateleiras AWS', async () => {
    const { getByText, getByLabelText } = await renderWithTheme(<StockMoveScreen />);

    await waitFor(() => {
      expect(getByText('Movimentação Interna')).toBeTruthy();
      expect(getByText('Macarrão Espaguete 500g')).toBeTruthy();
    });

    await fireEvent.press(getByLabelText('Gerenciar prateleiras e locais de armazenamento na AWS'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-storage');
  });
});
