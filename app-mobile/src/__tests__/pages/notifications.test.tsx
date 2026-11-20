import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter } from '../setup';
import * as apiModule from '../../services/api';
import NotificationsScreen from '../../app/notifications';
import NotificationsListScreen from '../../app/notifications-list';
import NotificationsConfigScreen from '../../app/notifications-config';

describe('Telas de Notificações (src/app/notifications*.tsx)', () => {
  beforeEach(() => {
    jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l1',
          nome_produto: 'Leite UHT',
          quantidade_atual_pacote: 3,
          estoque_minimo_pacote: 10,
          data_validade_lote: '2020-01-01',
          local_descricao: 'Geladeira 1 - Prateleira Central',
        },
      ],
      movimentacoes: [
        {
          id_movimentacao: 'm1',
          tipo_operacao: 'entrada',
          nome_produto: 'Arroz',
          quantidade_movimentada_pacote: 5,
          local_descricao: 'Armário A - Prateleira 1',
          data_hora_movimentacao: '2026-11-19T12:00:00Z',
        },
      ],
      campanhas: [
        {
          id_campanha_doacao: 'c1',
          nome_campanha: 'Campanha Leite',
          status_campanha: 'Aprovada',
        },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve listar alertas, filtrar categorias, ordenar e configurar avisos', async () => {
    const { getByLabelText, getAllByLabelText, getByText } = await renderWithTheme(<NotificationsScreen />);
    await waitFor(() => expect(getByText('Alertas')).toBeTruthy());

    await fireEvent.press(getByText('Alertas'));
    await fireEvent.press(getByText('Entradas'));
    await fireEvent.press(getByText('Todas'));
    await fireEvent.press(getByText('Título A–Z'));
    await fireEvent.press(getByText('Urgência'));

    await fireEvent.changeText(getByLabelText('Pesquisar notificações'), 'Leite');
    await fireEvent.press(getByLabelText('Limpar pesquisa'));
    const dispensarBtns = getAllByLabelText(/Dispensar notificação/);
    await fireEvent.press(dispensarBtns[0]);
    await waitFor(() => expect(getByLabelText('Restaurar notificações dispensadas')).toBeTruthy());
    await fireEvent.press(getByLabelText('Restaurar notificações dispensadas'));
    await fireEvent.press(getByLabelText('Tirar todas as notificações de uma vez'));
    await fireEvent.press(getByLabelText('Restaurar notificações dispensadas'));
    await fireEvent.press(getByLabelText('Configurar alertas de notificações'));
    expect(mockRouter.push).toHaveBeenCalledWith('/notifications-config');

    await renderWithTheme(<NotificationsListScreen />);
    const { getByLabelText: getCfg, getByText: getCfgTxt } = await renderWithTheme(
      <NotificationsConfigScreen />
    );
    await waitFor(() => expect(getCfgTxt('Configurar Avisos')).toBeTruthy());
    await fireEvent.press(getCfg('Ativar: Aviso de Estoque Mínimo'));
    await fireEvent.press(getCfgTxt(/Salvar Preferências/));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Preferências Salvas', expect.any(String), expect.any(Array)));
  });
});
