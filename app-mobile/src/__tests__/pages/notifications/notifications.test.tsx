import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import NotificationsScreen from '../../../app/notifications';
import { mockRouter } from '../../setup';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Avisos e Notificações (src/app/notifications.tsx)', () => {
  it('deve gerar alertas reais de lote vencido e estoque mínimo a partir da AWS', async () => {
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l_venc',
          numero_codigo_lote: 'LT-99',
          nome_produto: 'Iogurte Natural',
          quantidade_atual_pacote: 2,
          estoque_minimo_pacote: 5,
          data_validade_rotulo: '2020-01-01',
          local_descricao: 'Geladeira 1 - Prateleira Central',
        },
      ],
    });

    const { getByText } = await renderWithTheme(<NotificationsScreen />);

    await waitFor(() => {
      expect(getByText('🚨 Lote Vencido no Estoque')).toBeTruthy();
      expect(getByText('📉 Estoque Mínimo Atingido')).toBeTruthy();
    });

    await fireEvent.press(getByText('🚨 Lote Vencido no Estoque'));
    expect(mockRouter.push).toHaveBeenCalledWith('/stock-remove');

    await fireEvent.press(getByText('Ajustes'));
    expect(mockRouter.push).toHaveBeenCalledWith('/notifications-config');
  });

  it('deve exibir aviso de estoque regularizado quando não houver alertas', async () => {
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({
      sucesso: true,
      lotes: [],
    });

    const { getByText } = await renderWithTheme(<NotificationsScreen />);
    await waitFor(() => {
      expect(getByText('✅ Estoque Regularizado na AWS')).toBeTruthy();
    });
  });
});
