import React from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter } from '../setup';
import * as apiModule from '../../services/api';
import { authService } from '../../services/authService';
import LoginScreen from '../../app/index';
import ExpoAuthSessionScreen from '../../app/expo-auth-session';
import OAuthRedirectScreen from '../../app/oauthredirect';

describe('Telas de Autenticação (index, oauthredirect, expo-auth-session)', () => {
  beforeEach(async () => {
    await authService.limparSessaoLocal();
  });

  it('deve validar campos vazios, rejeitar erro da API e autenticar administrador institucional', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi');
    const { getByLabelText, getByPlaceholderText } = await renderWithTheme(<LoginScreen />);

    await fireEvent.press(getByLabelText('Entrar no aplicativo'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Atenção',
      'Por favor, informe seu e-mail e senha.'
    );

    await fireEvent.changeText(
      getByPlaceholderText('exemplo@casadacrianca.org.br'),
      'casadacrianca@adm'
    );
    await fireEvent.changeText(getByPlaceholderText('Digite sua senha'), 'casadacriancaadm');
    await fireEvent.press(getByLabelText('Visualizar senha'));

    spyApi.mockResolvedValueOnce({ sucesso: false, mensagem: 'Credenciais inválidas.' });
    await fireEvent.press(getByLabelText('Entrar no aplicativo'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Acesso Negado', 'Credenciais inválidas.');
    });

    spyApi.mockResolvedValueOnce({
      sucesso: true,
      usuario: {
        id_usuario: 'adm_casadacrianca_oficial',
        nome_usuario: 'Admin Casa da Criança',
        email_usuario: 'casadacrianca@adm',
        nivel_acesso_permissao: 'administrador',
      },
    });
    await fireEvent.press(getByLabelText('Entrar no aplicativo'));
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });
    spyApi.mockRestore();
  });

  it('deve executar fluxo Google OAuth mobile com retorno de proxy e modal de fallback', async () => {
    const payload = { sub: 'g1', name: 'Doador Teste', email: 'doador@gmail.com' };
    const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
      type: 'success',
      url: `exp://192.168.0.10:8081/--/oauthredirect#id_token=h.${b64}.s`,
    });

    const { getByLabelText, getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />
    );

    const listener = (Linking.addEventListener as jest.Mock).mock.calls[0]?.[1];
    if (listener) {
      await listener({ url: `exp://192.168.0.10:8081/--/oauthredirect#id_token=h.${b64}.s` });
    }

    await fireEvent.press(getByLabelText('Fazer login com o Google'));
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });

    // Quando o navegador lança erro, abre modal de seleção manual de contas Google
    jest.clearAllMocks();
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockRejectedValueOnce(new Error('Browser closed'));
    await fireEvent.press(getByLabelText('Fazer login com o Google'));
    await waitFor(() => expect(getByText('Escolha sua conta Google')).toBeTruthy());

    await fireEvent.press(getByText('Digitar meu e-mail Google'));
    await fireEvent.changeText(getByPlaceholderText('seu.email@gmail.com'), 'equipe@gmail.com');
    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'Equipe Teste');
    await fireEvent.press(getByText('Confirmar e Entrar com o Google'));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
  });

  it('deve autenticar via popup Google quando Platform.OS === web e processar getRedirectResult', async () => {
    const firebaseAuth = require('firebase/auth');
    const osOriginal = Platform.OS;
    (Platform as any).OS = 'web';

    (firebaseAuth.getRedirectResult as jest.Mock).mockResolvedValueOnce({
      user: {
        uid: 'u-red',
        displayName: 'Redirect Web',
        email: 'redweb@gmail.com',
        photoURL: '',
        getIdToken: async () => 'tok-web',
      },
    });

    const { getByLabelText } = await renderWithTheme(<LoginScreen />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
    await fireEvent.press(getByLabelText('Fazer login com o Google'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
    (Platform as any).OS = osOriginal;
  });

  it('deve processar retorno OAuth em OAuthRedirectScreen com e sem tokens', async () => {
    const payload = { sub: 'g2', name: 'Redirect User', email: 'redir@gmail.com' };
    const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
    (Linking.getInitialURL as jest.Mock).mockResolvedValueOnce(
      `exp://localhost/oauthredirect#id_token=h.${b64}.s`
    );
    await renderWithTheme(<OAuthRedirectScreen />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));

    (Linking.getInitialURL as jest.Mock).mockResolvedValueOnce(null);
    await renderWithTheme(<ExpoAuthSessionScreen />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
  });
});
