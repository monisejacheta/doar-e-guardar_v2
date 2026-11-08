import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import DiagnosticDatabaseScreen from '../../../app/diagnostic-database';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(() => Promise.resolve({ sucesso: true, lotes: [], movimentacoes: [] })),
}));

describe('Página: Diagnóstico de Bancos de Dados (src/app/diagnostic-database.tsx)', () => {
  it('deve auditar tabelas DynamoDB e sessão Firebase Auth', async () => {
    const { getByText } = await renderWithTheme(<DiagnosticDatabaseScreen />);

    await waitFor(() => {
      expect(getByText('9.2 Bancos de Dados (AWS + Firebase)')).toBeTruthy();
      expect(getByText('Tabela de Lotes (`tb_lotesProdutos`)')).toBeTruthy();
      expect(getByText('Prateleiras Homologadas (`tb_locaisArmazenamento`)')).toBeTruthy();
      expect(getByText('Histórico de Auditoria (`tb_movimentacoesEstoques`)')).toBeTruthy();
      expect(getByText('Autenticação Firebase Auth')).toBeTruthy();
    });
  });
});
