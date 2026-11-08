import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import SettingsUsersScreen from '../../../app/settings-users';
import { mockRouter } from '../../setup';

describe('Página: Usuários e Permissões RBAC (src/app/settings-users.tsx)', () => {
  it('deve exibir os perfis de acesso RBAC da Casa da Criança', async () => {
    const { getByText } = await renderWithTheme(<SettingsUsersScreen />);

    expect(getByText('6.6 Usuários e Permissões')).toBeTruthy();
    expect(getByText('Administrador / Diretoria')).toBeTruthy();
    expect(getByText('Operador de Estoque / Cozinha')).toBeTruthy();
    expect(getByText('Voluntário de Triagem')).toBeTruthy();

    await fireEvent.press(getByText('Voltar às Configurações'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
