import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import StockScreen from '../../../app/stock';
import { mockRouter } from '../../setup';
import * as storageModule from '../../../services/storageLocations';

jest.mock('../../../services/storageLocations', () => ({
  ...jest.requireActual('../../../services/storageLocations'),
  carregarPrateleirasAws: jest.fn(() =>
    Promise.resolve({
      locais: [
        { id_local_armazenamento: 'loc_1', local_descricao: 'Armário A - Prateleira 1', quantidade_pacotes_alocados: 15 },
      ],
      lotesNormalizados: [],
      discrepanciasCorrigidas: 0,
    })
  ),
}));

describe('Página: Gerenciamento de Estoque (src/app/stock.tsx)', () => {
  it('deve exibir os cartões de operações de estoque e navegar para cada subtela', async () => {
    const { getByText } = await renderWithTheme(<StockScreen />);

    await waitFor(() => {
      expect(getByText('Gerenciamento de Estoque')).toBeTruthy();
      expect(getByText('Entrada de Alimentos')).toBeTruthy();
      expect(getByText('Saída / Baixa')).toBeTruthy();
      expect(getByText('Movimentação Interna')).toBeTruthy();
      expect(getByText('Consulta de Lotes')).toBeTruthy();
      expect(getByText('Prateleiras e Armários (AWS)')).toBeTruthy();
    });

    await fireEvent.press(getByText('Entrada de Alimentos'));
    expect(mockRouter.push).toHaveBeenCalledWith('/stock-add');

    await fireEvent.press(getByText('Saída / Baixa'));
    expect(mockRouter.push).toHaveBeenCalledWith('/stock-remove');

    await fireEvent.press(getByText('Movimentação Interna'));
    expect(mockRouter.push).toHaveBeenCalledWith('/stock-move');

    await fireEvent.press(getByText('Consulta de Lotes'));
    expect(mockRouter.push).toHaveBeenCalledWith('/stock-details');
  });
});
