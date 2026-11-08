import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import AuditPeriodScreen from '../../../app/audit-period';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Auditoria por Período (src/app/audit-period.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      movimentacoes: [
        {
          id_movimentacao: 'm1',
          nome_produto: 'Macarrão Parafuso',
          operacao: 'Entrada',
          quantidade_movimentada_pacote: 12,
          data_hora_movimentacao: new Date().toISOString(),
        },
      ],
    });
  });

  it('deve listar movimentações e permitir alternar janela de dias (7, 30, 90, 1 Ano)', async () => {
    const { getByText } = await renderWithTheme(<AuditPeriodScreen />);

    await waitFor(() => {
      expect(getByText('Auditoria por Período')).toBeTruthy();
      expect(getByText(/Macarrão Parafuso/)).toBeTruthy();
    });

    await fireEvent.press(getByText('30 dias'));
    await fireEvent.press(getByText('90 dias'));
    await fireEvent.press(getByText('1 Ano'));
  });
});
