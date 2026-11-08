import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import LoginScreen from '../../../app/index';
import { mockRouter } from '../../setup';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Login (src/app/index.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar cabeçalho institucional, campos de login e botão do Google', async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(<LoginScreen />);

    expect(getByText('Doar & Guardar')).toBeTruthy();
    expect(getByText('Bem-vindo(a) de volta!')).toBeTruthy();
    expect(getByText('Fazer login com o Google')).toBeTruthy();
    expect(getByPlaceholderText('exemplo@casadacrianca.org.br')).toBeTruthy();
    expect(getByPlaceholderText('Digite sua senha')).toBeTruthy();
  });

  it('deve exibir alerta se tentar entrar com e-mail ou senha vazios', async () => {
    const { getByText } = await renderWithTheme(<LoginScreen />);
    await fireEvent.press(getByText('Entrar'));

    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Por favor, informe seu e-mail e senha.');
  });

  it('deve autenticar por credenciais com sucesso e redirecionar para /home', async () => {
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({ sucesso: true });

    const { getByPlaceholderText, getByText, getByLabelText } = await renderWithTheme(<LoginScreen />);

    await fireEvent.changeText(getByPlaceholderText('exemplo@casadacrianca.org.br'), 'admin@doareguardar.org');
    await fireEvent.changeText(getByPlaceholderText('Digite sua senha'), 'Senha123!');
    await fireEvent.press(getByLabelText('Visualizar senha'));
    await fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });
  });

  it('deve autenticar via Google e redirecionar para /home', async () => {
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({ sucesso: true });

    const { getByText } = await renderWithTheme(<LoginScreen />);
    await fireEvent.press(getByText('Fazer login com o Google'));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });
  });
});
