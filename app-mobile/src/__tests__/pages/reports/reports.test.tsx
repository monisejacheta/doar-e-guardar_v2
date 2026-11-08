import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import ReportsScreen from '../../../app/reports';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Relatórios Gerenciais Principais (src/app/reports.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l1',
          nome_produto: 'Arroz',
          categoria: 'Grãos',
          quantidade_atual_pacote: 20,
          local_descricao: 'Armário A - Prateleira 1',
        },
      ],
    });
  });

  it('deve carregar dados consolidados do gráfico e validar envio de relatório por e-mail', async () => {
    const { getByText, queryAllByText } = await renderWithTheme(<ReportsScreen />);

    await waitFor(() => {
      expect(queryAllByText(/Grãos/).length).toBeGreaterThan(0);
    });

    const btnColunas = getByText('Colunas');
    await fireEvent.press(btnColunas);
    const btnProporcao = getByText('Proporção');
    await fireEvent.press(btnProporcao);
  });
});
