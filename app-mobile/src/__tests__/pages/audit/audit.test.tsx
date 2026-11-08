import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import AuditScreen from '../../../app/audit';
import { mockRouter } from '../../setup';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Histórico e Auditoria Principal (src/app/audit.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      movimentacoes: [],
      lotes: [
        {
          id_lote_produto: 'l_aud_1',
          nome_produto: 'Arroz 5kg',
          numero_codigo_lote: 'LT-AUD',
          quantidade_atual_pacote: 10,
          local_descricao: 'Armário A - Prateleira 1',
        },
      ],
    });
  });

  it('deve exibir o índice de precisão do estoque e navegar para as 4 subtelas de auditoria', async () => {
    const { getByText } = await renderWithTheme(<AuditScreen />);

    await waitFor(() => {
      expect(getByText('Histórico e Auditoria')).toBeTruthy();
      expect(getByText('Precisão do Estoque')).toBeTruthy();
      expect(getByText('100%')).toBeTruthy();
    });

    await fireEvent.press(getByText('Por Produto'));
    expect(mockRouter.push).toHaveBeenCalledWith('/audit-product');

    await fireEvent.press(getByText('Por Operador'));
    expect(mockRouter.push).toHaveBeenCalledWith('/audit-user');

    await fireEvent.press(getByText('Por Período'));
    expect(mockRouter.push).toHaveBeenCalledWith('/audit-period');

    await fireEvent.press(getByText('Exportar Logs'));
    expect(mockRouter.push).toHaveBeenCalledWith('/audit-export');
  });
});
