import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent } from '../../test-utils';
import ProfileScreen from '../../../app/profile';
import { mockRouter } from '../../setup';

describe('Página: Meu Perfil (src/app/profile.tsx)', () => {
  it('deve renderizar dados do usuário e navegar para subtelas do perfil', async () => {
    const { getByText } = await renderWithTheme(<ProfileScreen />);

    expect(getByText('2.1.1 Visualizar Perfil Detalhado')).toBeTruthy();
    expect(getByText('2.1.2 Editar Perfil')).toBeTruthy();
    expect(getByText('2.1.3 Alterar Preferências e Acessibilidade')).toBeTruthy();

    await fireEvent.press(getByText('2.1.1 Visualizar Perfil Detalhado'));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile-view');

    await fireEvent.press(getByText('2.1.2 Editar Perfil'));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile-edit');

    await fireEvent.press(getByText('2.1.3 Alterar Preferências e Acessibilidade'));
    expect(mockRouter.push).toHaveBeenCalledWith('/accessibility');
  });

  it('deve exibir diálogo de confirmação ao tocar em Sair da Conta', async () => {
    const { getByText } = await renderWithTheme(<ProfileScreen />);
    await fireEvent.press(getByText('2.1.4 Sair da Conta (Logout)'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Encerrar Sessão',
      'Deseja realmente sair da sua conta na Casa da Criança?',
      expect.any(Array)
    );
  });
});
