import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authService,
  decodificarPayloadJwt,
  extrairParametrosOAuthDeUrl,
} from '../../services/authService';
import * as apiModule from '../../services/api';

describe('services/authService.ts', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await authService.limparSessaoLocal();
  });

  it('deve decodificar payload JWT em Base64URL com UTF-8', () => {
    const payload = { sub: 'u1', name: 'Maria José', email: 'maria@teste.org' };
    const b64 = Buffer.from(JSON.stringify(payload), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const token = `hdr.${b64}.sig`;
    expect(decodificarPayloadJwt(token)).toEqual(payload);
    expect(decodificarPayloadJwt('invalido')).toBeNull();
  });

  it('deve extrair tokens e erros de URL OAuth query e hash', () => {
    const res = extrairParametrosOAuthDeUrl(
      'exp://localhost/oauthredirect?id_token=tok123#access_token=acc456&error=access_denied'
    );
    expect(res.idToken).toBe('tok123');
    expect(res.accessToken).toBe('acc456');
    expect(res.error).toBe('access_denied');
    expect(extrairParametrosOAuthDeUrl('')).toEqual({});
  });

  it('deve salvar, ler e limpar sessão local e contas Google memorizadas', async () => {
    const usuario = {
      id_usuario: 'u1',
      nome_usuario: 'Operador',
      email_usuario: 'op@casadacrianca.org',
      nivel_acesso_permissao: 'funcionario_operador',
    };
    await authService.salvarSessaoLocal(usuario);
    expect(authService.obterUsuarioAtualSincrono()).toEqual(usuario);
    expect(await authService.obterSessaoLocal()).toEqual(usuario);

    await authService.salvarContaGoogleDispositivo({
      id: 'g1',
      name: 'Operador',
      email: 'op@casadacrianca.org',
    });
    const contas = await authService.obterContasGoogleSalvas();
    expect(contas).toHaveLength(1);
    expect(contas[0].email).toBe('op@casadacrianca.org');

    await authService.limparSessaoLocal();
    expect(authService.obterUsuarioAtualSincrono()).toBeNull();
    expect(await authService.obterSessaoLocal()).toBeNull();
  });

  it('deve finalizar sessão Google e sincronizar com backend AWS', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValueOnce({
      sucesso: true,
      usuario: {
        id_usuario: 'u_aws',
        nome_usuario: 'Ana Paula',
        email_usuario: 'ana@casadacrianca.org',
        nivel_acesso_permissao: 'funcionario_operador',
      },
    });

    const user = await authService.finalizarSessaoGoogle(
      { name: 'Ana Paula', email: 'ANA@casadacrianca.org' },
      'jwt-real'
    );

    expect(user.id_usuario).toBe('u_aws');
    expect(user.provedor_autenticacao).toBe('google');
    expect(spyApi).toHaveBeenCalled();
    spyApi.mockRestore();
  });

  it('deve manter contingência local caso sincronização AWS falhe', async () => {
    const spyApi = jest
      .spyOn(apiModule, 'requisicaoApi')
      .mockRejectedValueOnce(new Error('AWS Offline'));

    const user = await authService.finalizarSessaoGoogle({
      name: 'Contingência',
      email: 'cont@casadacrianca.org',
    });
    expect(user.email_usuario).toBe('cont@casadacrianca.org');
    spyApi.mockRestore();
  });

  it('deve autenticar com tokens Google via UserInfo/JWT', async () => {
    const payload = { sub: 'g99', name: 'Carlos', email: 'carlos@gmail.com' };
    const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockRejectedValueOnce(new Error('offline'));

    const user = await authService.autenticarComTokensGoogle(`h.${b64}.s`);
    expect(user).not.toBeNull();
    expect(user?.email_usuario).toBe('carlos@gmail.com');
    expect(authService.estaProcessandoOAuth()).toBe(false);
    expect(await authService.autenticarComTokensGoogle()).toBeNull();

    // Fluxo via accessToken (fallback UserInfo)
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sub: 'u_acc', email: 'acc@gmail.com', name: 'Access User' }),
    });
    spyApi.mockRejectedValueOnce(new Error('offline'));
    const userAcc = await authService.autenticarComTokensGoogle(undefined, 'access-tok-xyz');
    expect(userAcc?.email_usuario).toBe('acc@gmail.com');

    // Atualização de conta memorizada já existente no dispositivo
    await authService.salvarContaGoogleDispositivo({ id: 'g1', name: 'Carlos', email: 'CARLOS@gmail.com' });
    await authService.salvarContaGoogleDispositivo({ id: 'g1', name: 'Carlos Atualizado', email: 'carlos@gmail.com' });
    const contasFinal = await authService.obterContasGoogleSalvas();
    expect(contasFinal.find((c) => c.email === 'carlos@gmail.com')?.name).toBe('Carlos Atualizado');
    // Fluxo com auth.currentUser inicialmente nulo (executa signInAnonymously + updateProfile)
    const { auth } = require('../../services/firebaseConfig');
    const origUser = auth.currentUser;
    auth.currentUser = null;
    spyApi.mockResolvedValueOnce({
      sucesso: true,
      usuario: {
        id_usuario: 'u_anon',
        nome_usuario: 'Anon',
        email_usuario: 'anon@casadacrianca.org',
        nivel_acesso_permissao: 'operador',
      },
    });
    const anonUser = await authService.finalizarSessaoGoogle({
      name: 'Anon',
      email: 'anon@casadacrianca.org',
    });
    expect(anonUser.id_usuario).toBe('u_anon');
    auth.currentUser = origUser;

    // Fluxo com fallback Firebase user quando UserInfo falha e JWT é inválido
    const firebaseAuth = require('firebase/auth');
    (global as any).fetch = jest.fn().mockRejectedValueOnce(new Error('Rede UserInfo'));
    spyApi.mockRejectedValueOnce(new Error('offline'));
    const fbFallback = await authService.autenticarComTokensGoogle('invalido', 'tok-sem-email');
    expect(fbFallback?.email_usuario).toBe('admin@doareguardar.org');

    // Fluxo de erro final quando nem Firebase devolve e-mail
    (firebaseAuth.signInWithCredential as jest.Mock).mockRejectedValueOnce(new Error('Credencial inválida'));
    await expect(authService.autenticarComTokensGoogle('invalido')).rejects.toThrow(
      /e-mail da conta Google/
    );

    spyApi.mockRestore();
  });
});
