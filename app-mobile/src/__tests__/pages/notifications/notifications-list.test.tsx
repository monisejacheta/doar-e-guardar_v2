import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import NotificationsListScreen from '../../../app/notifications-list';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(() => Promise.resolve({ sucesso: true, lotes: [] })),
}));

describe('Página: Lista de Notificações (src/app/notifications-list.tsx)', () => {
  it('deve renderizar a listagem de avisos e notificações', async () => {
    const { getByText } = await renderWithTheme(<NotificationsListScreen />);
    await waitFor(() => {
      expect(getByText('Avisos e Notificações')).toBeTruthy();
    });
  });
});
