import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import StockAddScreen from '../../../app/stock-add';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Entrada de Alimentos / Cadastrar Lote (src/app/stock-add.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [],
      locais: [],
    });
  });

  it('deve renderizar a Etapa 1 de identificação por código de barras e scanner de câmera', async () => {
    const { getByText, getByLabelText } = await renderWithTheme(<StockAddScreen />);

    expect(getByText('Cadastrar Lote')).toBeTruthy();
    expect(getByText('1. Identificação do Código de Barras')).toBeTruthy();
    expect(getByText('Escanear Código com a Câmera')).toBeTruthy();
    expect(getByLabelText('Número do Código de Barras (EAN-8 a EAN-14):')).toBeTruthy();
  });

  it('deve alertar quando tentar consultar código de barras inválido e avançar para etapa 2 ao consultar EAN válido', async () => {
    const { getByText, getByLabelText } = await renderWithTheme(<StockAddScreen />);

    await fireEvent.press(getByText('Consultar Código e Preencher ➔'));
    expect(Alert.alert).toHaveBeenCalled();

    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({
      sucesso: true,
      existe_no_banco: true,
      produto: {
        id_produto: 'p1',
        nome_produto: 'Arroz Agulhinha',
        categoria: 'Grãos e Cereais',
        codigo_barra_produto: '7891000100103',
      },
    });

    await fireEvent.changeText(getByLabelText('Número do Código de Barras (EAN-8 a EAN-14):'), '7891000100103');
    await fireEvent.press(getByText('Consultar Código e Preencher ➔'));

    await waitFor(() => {
      expect(apiModule.requisicaoApi).toHaveBeenCalledWith(
        '/api/estoque',
        expect.objectContaining({
          metodo: 'POST',
        })
      );
    });
  });
});
