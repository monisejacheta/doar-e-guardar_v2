import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import HomeScreen from '../../../app/home';
import { mockRouter } from '../../setup';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Home (src/app/home.tsx)', () => {
  const lotesMock = [
    {
      id_lote_produto: 'lote_1',
      id_produto: 'prod_1',
      nome_produto: 'Arroz Agulhinha 5kg',
      categoria: 'Grãos',
      codigo_barra_produto: '7891000100103',
      numero_codigo_lote: 'LT-001',
      quantidade_atual_pacote: 25,
      estoque_minimo_pacote: 10,
      data_validade_lote: '2027-06-15',
      data_entrada_lote: '2026-10-01',
      local_descricao: 'Armário A - Prateleira 1',
    },
    {
      id_lote_produto: 'lote_2',
      id_produto: 'prod_2',
      nome_produto: 'Leite Integral 1L',
      categoria: 'Laticínios',
      codigo_barra_produto: '7891000200202',
      numero_codigo_lote: 'LT-002',
      quantidade_atual_pacote: 4,
      estoque_minimo_pacote: 10,
      data_validade_lote: '2020-01-01',
      data_entrada_lote: '2026-09-01',
      local_descricao: 'Geladeira 1 - Prateleira Central',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      lotes: lotesMock,
    });
  });

  it('deve carregar e exibir o resumo de pacotes, itens distintos e lista de produtos', async () => {
    const { getByText } = await renderWithTheme(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('29 pacotes')).toBeTruthy();
      expect(getByText('2 itens distintos')).toBeTruthy();
      expect(getByText('Arroz Agulhinha 5kg')).toBeTruthy();
      expect(getByText('Leite Integral 1L')).toBeTruthy();
    });
  });

  it('deve filtrar itens pela barra de busca e navegar para o perfil', async () => {
    const { getByPlaceholderText, getByText, queryByText, getByLabelText } = await renderWithTheme(<HomeScreen />);

    await waitFor(() => expect(getByText('Arroz Agulhinha 5kg')).toBeTruthy());

    await fireEvent.changeText(getByPlaceholderText('Buscar por nome ou código...'), 'Leite');
    expect(queryByText('Arroz Agulhinha 5kg')).toBeNull();
    expect(getByText('Leite Integral 1L')).toBeTruthy();

    await fireEvent.press(getByLabelText('Abrir meu perfil'));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile');
  });
});
