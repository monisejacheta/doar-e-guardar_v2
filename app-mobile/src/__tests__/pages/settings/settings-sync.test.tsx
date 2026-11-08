import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import SettingsSyncScreen from '../../../app/settings-sync';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(() => Promise.resolve({ sucesso: true, lotes: [], movimentacoes: [] })),
}));

describe('Página: Backup e Sincronização AWS (src/app/settings-sync.tsx)', () => {
  it('deve sincronizar com o DynamoDB na AWS e exibir o resumo de tabelas', async () => {
    const { getByText } = await renderWithTheme(<SettingsSyncScreen />);

    await waitFor(() => {
      expect(getByText('6.8 Backup e Sincronização AWS')).toBeTruthy();
      expect(getByText(/Nuvem AWS Sincronizada/)).toBeTruthy();
    });

    await fireEvent.press(getByText('Sincronizar Agora com a AWS'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sincronização AWS Concluída', expect.any(String));
    });
  });
});
