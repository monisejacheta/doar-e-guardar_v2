// app-mobile/src/services/authService.ts
import { requisicaoApi } from './api';

export interface UsuarioAutenticado {
  id_usuario: string;
  nome_usuario: string;
  email_usuario: string;
  nivel_acesso_permissao: string;
  url_foto_perfil?: string;
}

export const authService = {
  /**
   * Envia os dados reais da autenticação para validação na AWS Lambda e persistência no DynamoDB.
   */
  async sincronizarUsuarioComBackend(
    idToken: string,
    perfil: { id: string; name?: string | null; email?: string | null; foto?: string | null },
    plataforma: string = 'portal_web'
  ): Promise<UsuarioAutenticado> {
    const resposta: any = await requisicaoApi('/api/auth/login', {
      metodo: 'POST',
      dados: {
        tipo_login: 'google',
        id_token: idToken,
        perfil_usuario: perfil,
        plataforma,
      },
    });

    if (!resposta.sucesso || !resposta.usuario) {
      throw new Error(resposta.mensagem || 'Não foi possível autorizar o acesso.');
    }

    return resposta.usuario;
  },
};