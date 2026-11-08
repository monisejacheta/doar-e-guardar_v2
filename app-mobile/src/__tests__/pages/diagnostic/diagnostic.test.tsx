import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import DiagnosticScreen from '../../../app/diagnostic';
import { mockRouter } from '../../setup';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  API_BASE_URL: 'https://lambda.us-east-2.on.aws',
  requisicaoApi: jest.fn(),
}));

describe('Página: Disponibilidade e Diagnóstico do Sistema (src/app/diagnostic.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [{ id_lote_produto: 'l1', quantidade_atual_pacote: 5 }],
    });
  });

  it('deve executar diagnóstico em tempo real e navegar para as 4 subtelas técnicas', async () => {
    const { getByText } = await renderWithTheme(<DiagnosticScreen />);

    await waitFor(() => {
      expect(getByText('Disponibilidade do Sistema')).toBeTruthy();
      expect(getByText('9.1 Funções Serverless AWS Lambda')).toBeTruthy();
      expect(getByText('9.2 Bancos de Dados (DynamoDB + Firebase)')).toBeTruthy();
      expect(getByText('9.3 Cascata de 3 APIs (Código de Barras)')).toBeTruthy();
      expect(getByText('9.4 Configurar Chaves e Integrações')).toBeTruthy();
    });

    await fireEvent.press(getByText('9.1 Funções Serverless AWS Lambda'));
    expect(mockRouter.push).toHaveBeenCalledWith('/diagnostic-aws');

    await fireEvent.press(getByText('9.2 Bancos de Dados (DynamoDB + Firebase)'));
    expect(mockRouter.push).toHaveBeenCalledWith('/diagnostic-database');

    await fireEvent.press(getByText('9.3 Cascata de 3 APIs (Código de Barras)'));
    expect(mockRouter.push).toHaveBeenCalledWith('/diagnostic-apis');

    await fireEvent.press(getByText('9.4 Configurar Chaves e Integrações'));
    expect(mockRouter.push).toHaveBeenCalledWith('/diagnostic-config');
  });
});
