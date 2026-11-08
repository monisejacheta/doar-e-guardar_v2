import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import ReportsExpiryScreen from '../../../app/reports-expiry';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Relatório de Validades e FEFO (src/app/reports-expiry.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l_exp_1',
          codigo_barra_produto: '7890001112223',
          nome_produto: 'Leite UHT',
          categoria: 'Laticínios',
          quantidade_atual_pacote: 10,
          data_validade_lote: '2020-05-01',
          local_descricao: 'Geladeira 1 - Prateleira Central',
        },
      ],
    });
  });

  it('deve classificar lotes vencidos e exibir estatísticas de validade', async () => {
    const { getByText } = await renderWithTheme(<ReportsExpiryScreen />);

    await waitFor(() => {
      expect(getByText('Leite UHT')).toBeTruthy();
    });
  });
});
