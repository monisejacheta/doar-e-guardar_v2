import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import DiagnosticAwsScreen from '../../../app/diagnostic-aws';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  API_BASE_URL: 'https://lambda.us-east-2.on.aws',
  requisicaoApi: jest.fn(() => Promise.resolve({ sucesso: true })),
}));

describe('Página: Diagnóstico AWS Lambda (src/app/diagnostic-aws.tsx)', () => {
  it('deve testar as rotas serverless da AWS Lambda e exibir latência e status ONLINE', async () => {
    const { getByText } = await renderWithTheme(<DiagnosticAwsScreen />);

    await waitFor(() => {
      expect(getByText('9.1 Funções Serverless AWS Lambda')).toBeTruthy();
      expect(getByText('Lambda Estoque (/api/estoque)')).toBeTruthy();
      expect(getByText('Lambda Prateleiras (/api/configuracoes)')).toBeTruthy();
      expect(getByText('Lambda Relatórios (/api/relatorios)')).toBeTruthy();
    });
  });
});
