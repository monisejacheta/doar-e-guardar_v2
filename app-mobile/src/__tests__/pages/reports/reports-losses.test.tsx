import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import ReportsLossesScreen from '../../../app/reports-losses';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Relatório de Perdas e Descartes (src/app/reports-losses.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      movimentacoes: [
        {
          id_movimentacao: 'm_loss_1',
          nome_produto: 'Iogurte Morango',
          categoria: 'Laticínios',
          operacao: 'Saída',
          motivo_saida: 'perda - descarte vencido',
          quantidade_movimentada_pacote: 3,
          data_hora_movimentacao: '2026-10-10T10:00:00',
        },
      ],
      lotes: [],
    });
  });

  it('deve carregar e consolidar o histórico de perdas e descartes da AWS', async () => {
    const { getByText } = await renderWithTheme(<ReportsLossesScreen />);

    await waitFor(() => {
      expect(getByText('Iogurte Morango')).toBeTruthy();
    });
  });
});
