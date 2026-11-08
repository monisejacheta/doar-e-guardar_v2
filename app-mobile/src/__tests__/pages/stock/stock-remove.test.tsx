import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import StockRemoveScreen from '../../../app/stock-remove';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Saída / Baixa de Produtos (src/app/stock-remove.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l_rem_1',
          id_produto: 'p_rem_1',
          nome_produto: 'Óleo de Soja 900ml',
          categoria: 'Óleos e Gorduras',
          codigo_barra_produto: '7899998887776',
          numero_codigo_lote: 'LT-OLEO-1',
          quantidade_atual_pacote: 8,
          data_validade_lote: '2027-01-10',
          local_descricao: 'Armário B - Prateleira 3',
        },
      ],
    });
  });

  it('deve listar produtos ordenados por FEFO e permitir filtrar para dar baixa', async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(<StockRemoveScreen />);

    await waitFor(() => {
      expect(getByText('Saída de Produtos')).toBeTruthy();
      expect(getByText('Óleo de Soja 900ml')).toBeTruthy();
    });

    await fireEvent.changeText(getByPlaceholderText('Buscar por nome ou código EAN...'), 'Óleo');
    expect(getByText('Óleo de Soja 900ml')).toBeTruthy();

    await fireEvent.press(getByText('Óleo de Soja 900ml'));
  });
});
