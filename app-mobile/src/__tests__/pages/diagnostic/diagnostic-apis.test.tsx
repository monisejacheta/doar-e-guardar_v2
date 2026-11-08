import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import DiagnosticApisScreen from '../../../app/diagnostic-apis';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Diagnóstico da Cascata de 3 APIs EAN (src/app/diagnostic-apis.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve testar um código EAN na cascata e exibir o produto encontrado', async () => {
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({
      encontrado: true,
      fonte: 'Open Food Facts',
      dados: {
        nome_basico: 'Arroz Integral',
        marca_fabricante: 'Camil',
        categoria: 'Grãos e Cereais',
      },
    });

    const { getByText } = await renderWithTheme(<DiagnosticApisScreen />);

    expect(getByText('9.3 Cascata de 3 APIs (Código de Barras)')).toBeTruthy();
    await fireEvent.press(getByText('Disparar Consulta Real na Cascata'));

    await waitFor(() => {
      expect(getByText('✅ PRODUTO IDENTIFICADO')).toBeTruthy();
    });
  });

  it('deve alertar quando o EAN digitado tiver menos de 8 dígitos', async () => {
    const { getByText, getByLabelText } = await renderWithTheme(<DiagnosticApisScreen />);
    await fireEvent.changeText(getByLabelText('Código EAN para Teste Real na Cascata'), '123');
    await fireEvent.press(getByText('Disparar Consulta Real na Cascata'));

    expect(Alert.alert).toHaveBeenCalledWith('EAN Inválido', expect.any(String));
  });
});
