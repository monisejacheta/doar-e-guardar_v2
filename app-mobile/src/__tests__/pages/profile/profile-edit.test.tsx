import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import ProfileEditScreen from '../../../app/profile-edit';

describe('Página: Editar Perfil (src/app/profile-edit.tsx)', () => {
  it('deve permitir editar o nome e setor do operador e salvar alterações', async () => {
    const { getByText, getByLabelText } = await renderWithTheme(<ProfileEditScreen />);

    expect(getByText('2.1.2 Editar Perfil')).toBeTruthy();
    await fireEvent.changeText(
      getByLabelText('Nome Completo / Identificação na Auditoria'),
      'Juliana Operadora'
    );
    await fireEvent.press(getByText('Salvar Dados do Perfil'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Perfil Atualizado',
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  it('deve alertar quando o nome estiver vazio', async () => {
    const { getByText, getByLabelText } = await renderWithTheme(<ProfileEditScreen />);
    await fireEvent.changeText(getByLabelText('Nome Completo / Identificação na Auditoria'), '   ');
    await fireEvent.press(getByText('Salvar Dados do Perfil'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Campo Obrigatório',
      'Informe o nome de identificação do operador.'
    );
  });
});
