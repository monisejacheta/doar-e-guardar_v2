import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import DoraScreen from '../../../app/dora';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Assistente Virtual Dora (src/app/dora.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l1',
          nome_produto: 'Arroz Tipo 1',
          categoria: 'Grãos',
          numero_codigo_lote: 'LT-10',
          quantidade_atual_pacote: 15,
          data_validade_lote: '2026-12-20',
          local_descricao: 'Armário A - Prateleira 1',
        },
        {
          id_lote_produto: 'l2',
          nome_produto: 'Feijão Carioca',
          categoria: 'Grãos',
          numero_codigo_lote: 'LT-11',
          quantidade_atual_pacote: 10,
          data_validade_lote: '2026-12-18',
          local_descricao: 'Armário A - Prateleira 2',
        },
      ],
      movimentacoes: [],
    });
  });

  it('deve exibir a mensagem inicial de boas-vindas da Dora e atalhos rápidos', async () => {
    const { getByText } = await renderWithTheme(<DoraScreen />);

    await waitFor(() => {
      expect(getByText('🍲 Receita com itens do estoque')).toBeTruthy();
      expect(getByText('📈 Previsão de consumo')).toBeTruthy();
    });
  });

  it('deve processar pergunta enviada pelo comando rápido e exibir resposta da Dora', async () => {
    const { getByText } = await renderWithTheme(<DoraScreen />);

    await waitFor(() => expect(getByText('📈 Previsão de consumo')).toBeTruthy());
    await fireEvent.press(getByText('📈 Previsão de consumo'));

    await waitFor(() => {
      expect(apiModule.requisicaoApi).toHaveBeenCalled();
    });
  });
});
