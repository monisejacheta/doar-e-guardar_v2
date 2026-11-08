import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import SettingsStorageScreen from '../../../app/settings-storage';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(() => Promise.resolve({ sucesso: true, lotes: [], locais: [] })),
}));

describe('Página: Locais e Prateleiras AWS (src/app/settings-storage.tsx)', () => {
  it('deve exibir as prateleiras homologadas e permitir cadastrar uma nova prateleira (Regra US06)', async () => {
    const { getByText, getByLabelText } = await renderWithTheme(<SettingsStorageScreen />);

    await waitFor(() => {
      expect(getByText('Locais e Prateleiras (AWS)')).toBeTruthy();
      expect(getByText('Cadastrar Nova Prateleira / Gaveta')).toBeTruthy();
    });

    await fireEvent.changeText(getByLabelText('Nome do Armário ou Geladeira *'), 'Armário D');
    await fireEvent.changeText(getByLabelText('Identificação da Prateleira ou Gaveta *'), 'Prateleira 1');
    await fireEvent.press(getByText('Homologar Prateleira na AWS'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Prateleira Homologada', expect.any(String));
    });
  });
});
