// app-mobile/src/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requisicaoApi } from './api';

export interface UsuarioAutenticado {
  id_usuario: string;
  nome_usuario: string;
  email_usuario: string;
  nivel_acesso_permissao: string;
  url_foto_perfil?: string;
  provedor_autenticacao?: 'google' | 'credenciais';
}

export interface ContaGoogleSalva {
  id: string;
  name: string;
  email: string;
  foto?: string;
  ultimoAcesso?: string;
}

const CHAVE_SESSAO_ATIVA = 'dg_usuario_sessao_ativa';
const CHAVE_CONTAS_GOOGLE_MEMORIA = 'dg_contas_google_dispositivo';

// Cache em memória para acesso síncrono rápido
let _usuarioAtualMemoria: UsuarioAutenticado | null = null;

export const authService = {
  /**
   * Salva a sessão ativa localmente no dispositivo para persistência entre telas e reinicializações
   */
  async salvarSessaoLocal(usuario: UsuarioAutenticado): Promise<void> {
    _usuarioAtualMemoria = usuario;
    try {
      await AsyncStorage.setItem(CHAVE_SESSAO_ATIVA, JSON.stringify(usuario));
    } catch (e) {
      console.warn('[authService] Erro ao persistir sessão local:', e);
    }
  },

  /**
   * Obtém a sessão do usuário autenticado atualmente
   */
  async obterSessaoLocal(): Promise<UsuarioAutenticado | null> {
    if (_usuarioAtualMemoria) return _usuarioAtualMemoria;
    try {
      const bruto = await AsyncStorage.getItem(CHAVE_SESSAO_ATIVA);
      if (bruto) {
        _usuarioAtualMemoria = JSON.parse(bruto);
        return _usuarioAtualMemoria;
      }
    } catch (e) {
      console.warn('[authService] Erro ao ler sessão local:', e);
    }
    return null;
  },

  /**
   * Retorno síncrono rápido do usuário na memória
   */
  obterUsuarioAtualSincrono(): UsuarioAutenticado | null {
    return _usuarioAtualMemoria;
  },

  /**
   * Remove a sessão ativa no logout
   */
  async limparSessaoLocal(): Promise<void> {
    _usuarioAtualMemoria = null;
    try {
      await AsyncStorage.removeItem(CHAVE_SESSAO_ATIVA);
    } catch (e) {
      console.warn('[authService] Erro ao remover sessão:', e);
    }
  },

  /**
   * Lista as contas Google que já foram utilizadas ou memorizadas no aparelho
   */
  async obterContasGoogleSalvas(): Promise<ContaGoogleSalva[]> {
    try {
      const bruto = await AsyncStorage.getItem(CHAVE_CONTAS_GOOGLE_MEMORIA);
      if (bruto) {
        return JSON.parse(bruto);
      }
    } catch (e) {
      console.warn('[authService] Erro ao obter contas Google memorizadas:', e);
    }
    return [];
  },

  /**
   * Registra uma conta Google na lista de contas do dispositivo para fácil seleção
   */
  async salvarContaGoogleDispositivo(conta: ContaGoogleSalva): Promise<void> {
    try {
      const contasExistentes = await this.obterContasGoogleSalvas();
      const filtradas = contasExistentes.filter((c) => c.email.toLowerCase() !== conta.email.toLowerCase());
      filtradas.unshift({
        ...conta,
        ultimoAcesso: new Date().toISOString(),
      });
      // Mantém no máximo as 5 últimas contas
      await AsyncStorage.setItem(CHAVE_CONTAS_GOOGLE_MEMORIA, JSON.stringify(filtradas.slice(0, 5)));
    } catch (e) {
      console.warn('[authService] Erro ao memorizar conta Google:', e);
    }
  },

  /**
   * Envia os dados reais da autenticação para validação na AWS Lambda e persistência no DynamoDB.
   */
  async sincronizarUsuarioComBackend(
    idToken: string,
    perfil: { id: string; name?: string | null; email?: string | null; foto?: string | null },
    plataforma: string = 'mobile_android'
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

    const usuarioAutenticado: UsuarioAutenticado = {
      id_usuario: resposta.usuario.id_usuario,
      nome_usuario: resposta.usuario.nome_usuario,
      email_usuario: resposta.usuario.email_usuario,
      nivel_acesso_permissao: resposta.usuario.nivel_acesso_permissao,
      url_foto_perfil: resposta.usuario.url_foto_perfil || perfil.foto || undefined,
      provedor_autenticacao: 'google',
    };

    await this.salvarSessaoLocal(usuarioAutenticado);
    return usuarioAutenticado;
  },
};
