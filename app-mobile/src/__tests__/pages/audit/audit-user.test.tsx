import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import AuditUserScreen from '../../../app/audit-user';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Auditoria por Operador (src/app/audit-user.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      movimentacoes: [
        {
          id_movimentacao: 'mu1',
          id_usuario_responsavel: 'operador@casadacrianca.org.br',
          data_hora_movimentacao: '2026-11-05T09:15:00',
        },
        {
          id_movimentacao: 'mu2',
          id_usuario_responsavel: 'operador@casadacrianca.org.br',
          data_hora_movimentacao: '2026-11-06T11:20:00',
        },
      ],
    });
  });

  it('deve consolidar a quantidade de ações auditadas por operador responsável', async () => {
    const { getByText } = await renderWithTheme(<AuditUserScreen />);

    await waitFor(() => {
      expect(getByText('Auditoria por Operador')).toBeTruthy();
      expect(getByText('operador@casadacrianca.org.br')).toBeTruthy();
      expect(getByText('2 ação(ões)')).toBeTruthy();
    });
  });
});
