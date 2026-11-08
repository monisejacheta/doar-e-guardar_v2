import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import StockDetailsScreen from '../../../app/stock-details';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Consulta de Lotes / Detalhes do Estoque (src/app/stock-details.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l_10',
          id_produto: 'p_10',
          nome_produto: 'Feijão Preto 1kg',
          categoria: 'Grãos',
          codigo_barra_produto: '7891112223334',
          numero_codigo_lote: 'LT-FEIJAO',
          quantidade_atual_pacote: 18,
          data_validade_lote: '2027-03-10',
          local_descricao: 'Armário B - Prateleira 1',
        },
      ],
    });
  });

  it('deve carregar os lotes ativos, permitir filtrar por pesquisa e abrir modal de detalhes', async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(<StockDetailsScreen />);

    await waitFor(() => {
      expect(getByText('Consulta de Estoque')).toBeTruthy();
      expect(getByText('Feijão Preto 1kg')).toBeTruthy();
    });

    await fireEvent.press(getByText('Feijão Preto 1kg'));

    await fireEvent.changeText(
      getByPlaceholderText('Pesquisar catálogo por nome, EAN ou prateleira...'),
      'Inexistente'
    );
    expect(getByText('Nenhum produto localizado no estoque.')).toBeTruthy();
  });
});
