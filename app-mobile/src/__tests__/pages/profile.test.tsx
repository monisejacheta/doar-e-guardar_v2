import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter } from '../setup';
import ProfileScreen from '../../app/profile';
import ProfileViewScreen from '../../app/profile-view';
import ProfileEditScreen from '../../app/profile-edit';
import ProfilePreferencesScreen from '../../app/profile-preferences';

describe('Telas de Perfil (src/app/profile*.tsx)', () => {
  it('deve renderizar perfil principal, executar logout e editar dados em ProfileEditScreen', async () => {
    const { getByLabelText } = await renderWithTheme(<ProfileScreen />);
    await waitFor(() => expect(getByLabelText('Voltar para a tela anterior')).toBeTruthy());
    await fireEvent.press(getByLabelText('Voltar para a tela anterior'));
    expect(mockRouter.back).toHaveBeenCalled();

    await fireEvent.press(getByLabelText('Sair da Conta'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));

    const { getByText: getViewText } = await renderWithTheme(<ProfileViewScreen />);
    await waitFor(() => expect(getViewText('Voltar ao Perfil')).toBeTruthy());

    const edit = await renderWithTheme(<ProfileEditScreen />);
    await waitFor(() => expect(edit.getByPlaceholderText('Ex: Maria Silva')).toBeTruthy());
    await fireEvent.changeText(edit.getByPlaceholderText('Ex: Maria Silva'), '');
    await fireEvent.press(edit.getByText('Salvar Dados do Perfil'));
    expect(Alert.alert).toHaveBeenCalledWith('Campo Obrigatório', expect.any(String));

    await fireEvent.changeText(edit.getByPlaceholderText('Ex: Maria Silva'), 'Juliano Mancini');
    await fireEvent.changeText(edit.getByPlaceholderText('Ex: Cozinha / Despensa'), 'Nutrição');
    await fireEvent.press(edit.getByText('Salvar Dados do Perfil'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Perfil Atualizado!', expect.any(String), expect.any(Array))
    );

    await renderWithTheme(<ProfilePreferencesScreen />);
  });
});
