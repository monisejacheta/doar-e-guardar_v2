import { authService } from '../../services/authService';
import * as apiModule from '../../services/api';

jest.mock('../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Serviço de Autenticação (authService.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve sincronizar o usuário com o backend e retornar os dados autenticados', async () => {
    const usuarioMock = {
      id_usuario: 'usr_01',
      nome_usuario: 'Maria Silva',
      email_usuario: 'maria@doareguardar.org',
      nivel_acesso_permissao: 'admin',
    };

    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({
      sucesso: true,
      usuario: usuarioMock,
    });

    const resultado = await authService.sincronizarUsuarioComBackend(
      'token-google-123',
      { id: 'usr_01', name: 'Maria Silva', email: 'maria@doareguardar.org' },
      'app_mobile'
    );

    expect(apiModule.requisicaoApi).toHaveBeenCalledWith('/api/auth/login', {
      metodo: 'POST',
      dados: {
        tipo_login: 'google',
        id_token: 'token-google-123',
        perfil_usuario: { id: 'usr_01', name: 'Maria Silva', email: 'maria@doareguardar.org' },
        plataforma: 'app_mobile',
      },
    });
    expect(resultado).toEqual(usuarioMock);
  });

  it('deve lançar erro quando o backend recusar a autorização', async () => {
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValueOnce({
      sucesso: false,
      mensagem: 'Conta desativada',
    });

    await expect(
      authService.sincronizarUsuarioComBackend('token-invalido', { id: 'usr_02' })
    ).rejects.toThrow('Conta desativada');
  });
});
