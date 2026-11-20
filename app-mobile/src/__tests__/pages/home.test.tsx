import React from 'react';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter, mockUseLocalSearchParams } from '../setup';
import * as apiModule from '../../services/api';
import HomeScreen from '../../app/home';
import ExploreRedirectScreen from '../../app/explore';
import GenericSubscreen from '../../app/generic-subscreen';

describe('Telas Iniciais (home, explore, generic-subscreen)', () => {
  const lotesMock = [
    {
      id_lote_produto: 'l1',
      id_produto: 'p1',
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
      id_lote_produto: 'l2',
      id_produto: 'p2',
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
    {
      id_lote_produto: 'l3',
      id_produto: 'p1',
      nome_produto: 'Arroz Agulhinha 5kg',
      categoria: 'Grãos',
      codigo_barra_produto: '7891000100103',
      numero_codigo_lote: 'LT-003',
      quantidade_atual_pacote: 5,
      estoque_minimo_pacote: 10,
      data_validade_lote: '2026-11-28',
      data_entrada_lote: '2026-10-15',
      local_descricao: 'Armário A - Prateleira 2',
    },
  ];

  it('HomeScreen deve carregar lotes, filtrar por busca avançada, alternar modo grade e abrir detalhe', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValue({
      sucesso: true,
      lotes: lotesMock,
    });

    const { getByText, queryByText, getByPlaceholderText, getByLabelText } = await renderWithTheme(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByText('34 pacotes')).toBeTruthy();
      expect(getByText('2 itens distintos')).toBeTruthy();
    });

    // Alterna visualização lista/grade e abre busca avançada
    await fireEvent.press(getByText('grid'));
    await fireEvent.press(getByText('list'));
    await fireEvent.press(getByText('sliders'));
    expect(getByText('Categorias de Produtos:')).toBeTruthy();
    await fireEvent.press(getByText('Grãos'));
    expect(queryByText('Leite Integral 1L')).toBeNull();
    await fireEvent.press(getByText('Todas as Categorias'));

    // Busca textual e critérios de ordenação
    await fireEvent.changeText(getByPlaceholderText('Buscar por nome ou código...'), '');
    await fireEvent.press(getByText(/Qtd\. em estoque/));
    await fireEvent.press(getByText(/Qtd\. em estoque/));
    await fireEvent.press(getByText(/Data de validade/));
    await fireEvent.press(getByText(/Ordem alfabética/));
    await fireEvent.press(getByText(/Prioridade de saída/));

    await fireEvent.changeText(getByPlaceholderText('Buscar por nome ou código...'), 'Leite');
    expect(queryByText('Arroz Agulhinha 5kg')).toBeNull();
    expect(getByText('Leite Integral 1L')).toBeTruthy();

    await fireEvent.press(getByText('Leite Integral 1L'));
    expect(getByText('Lotes e Prateleiras')).toBeTruthy();

    await fireEvent.press(getByLabelText('Abrir meu perfil'));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile');
    spyApi.mockRestore();

    // Erro de rede na HomeScreen
    const spyErro = jest.spyOn(apiModule, 'requisicaoApi').mockRejectedValueOnce(new Error('Falha AWS'));
    const homeErr = await renderWithTheme(<HomeScreen />);
    await waitFor(() => expect(homeErr.queryByText('Atualizando os itens do estoque...')).toBeNull());
    spyErro.mockRestore();
  });

  it('ExploreRedirectScreen e GenericSubscreen devem renderizar e navegar corretamente', async () => {
    await renderWithTheme(<ExploreRedirectScreen />);
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');

    mockUseLocalSearchParams.mockReturnValue({
      title: 'Subtela Teste',
      subtitle: 'Descrição da subtela',
    });
    const { getByText } = await renderWithTheme(<GenericSubscreen />);
    expect(getByText('Subtela Teste')).toBeTruthy();
    await fireEvent.press(getByText('Voltar'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
