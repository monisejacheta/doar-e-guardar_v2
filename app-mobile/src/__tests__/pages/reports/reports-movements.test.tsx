import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import ReportsMovementsScreen from '../../../app/reports-movements';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Relatório de Movimentações (src/app/reports-movements.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      movimentacoes: [
        {
          id_movimentacao_estoque: 'mov_1',
          nome_produto: 'Arroz 5kg',
          categoria: 'Grãos',
          operacao: 'Entrada',
          quantidade_movimentada_pacote: 10,
          data_hora_movimentacao: '2026-11-01T14:30:00',
          id_usuario_responsavel: 'Maria',
          numero_codigo_lote: 'LT-01',
          local_descricao: 'Armário A - Prateleira 1',
        },
      ],
    });
  });

  it('deve carregar e exibir a linha do tempo de movimentações do estoque', async () => {
    const { getByText } = await renderWithTheme(<ReportsMovementsScreen />);

    await waitFor(() => {
      expect(getByText('Arroz 5kg')).toBeTruthy();
    });
  });
});
