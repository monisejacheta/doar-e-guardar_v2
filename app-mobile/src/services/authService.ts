// app-mobile/src/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInAnonymously, signInWithCredential, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
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
let _processandoRedirectGoogle = false;

/**
 * Decodifica o payload de um JWT (Base64URL) com suporte seguro a UTF-8 no Hermes/React Native
 */
export function decodificarPayloadJwt(jwtToken: string): Record<string, any> | null {
  try {
    const partes = jwtToken.split('.');
    if (partes.length !== 3) return null;

    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const base64Pad = pad ? base64 + '='.repeat(4 - pad) : base64;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let strBinaria = '';
    for (let i = 0; i < base64Pad.length; i += 4) {
      const e1 = chars.indexOf(base64Pad.charAt(i));
      const e2 = chars.indexOf(base64Pad.charAt(i + 1));
      const e3 = chars.indexOf(base64Pad.charAt(i + 2));
      const e4 = chars.indexOf(base64Pad.charAt(i + 3));

      const n = (e1 << 18) | (e2 << 12) | ((e3 & 63) << 6) | (e4 & 63);
      strBinaria += String.fromCharCode((n >> 16) & 255);
      if (e3 !== 64) strBinaria += String.fromCharCode((n >> 8) & 255);
      if (e4 !== 64) strBinaria += String.fromCharCode(n & 255);
    }

    const percentEncoded = strBinaria
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('');

    return JSON.parse(decodeURIComponent(percentEncoded));
  } catch (e) {
    console.warn('[authService] Falha ao decodificar JWT:', e);
    return null;
  }
}

/**
 * Extrai id_token, access_token ou erro de uma URL de redirecionamento OAuth (query ou hash)
 */
export function extrairParametrosOAuthDeUrl(url: string): {
  idToken?: string;
  accessToken?: string;
  error?: string;
  errorDescription?: string;
} {
  if (!url) return {};

  const coletarParams = (trecho: string, destino: Record<string, string>) => {
    if (!trecho) return;
    const pares = trecho.replace(/^[?#]/, '').split('&');
    for (const par of pares) {
      if (!par) continue;
      const idx = par.indexOf('=');
      if (idx === -1) continue;
      const chave = decodeURIComponent(par.slice(0, idx));
      const valor = decodeURIComponent(par.slice(idx + 1).replace(/\+/g, ' '));
      destino[chave] = valor;
    }
  };

  const params: Record<string, string> = {};
  const idxHash = url.indexOf('#');
  const idxQuery = url.indexOf('?');

  if (idxQuery !== -1) {
    const fimQuery = idxHash !== -1 && idxHash > idxQuery ? idxHash : url.length;
    coletarParams(url.slice(idxQuery + 1, fimQuery), params);
  }
  if (idxHash !== -1) {
    coletarParams(url.slice(idxHash + 1), params);
  }

  // Caso o auth.expo.io retorne params aninhados
  if (params.params) {
    try {
      const subParams = JSON.parse(params.params);
      Object.assign(params, subParams);
    } catch {
      // ignora
    }
  }

  return {
    idToken: params.id_token || params.idToken,
    accessToken: params.access_token || params.accessToken,
    error: params.error || params.errorCode,
    errorDescription: params.error_description,
  };
}

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
   * Informa se uma resposta OAuth do Google está sendo validada no momento
   */
  estaProcessandoOAuth(): boolean {
    return _processandoRedirectGoogle;
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

  /**
   * Finaliza a sessão no Firebase Auth, persiste localmente e sincroniza com a AWS Lambda
   */
  async finalizarSessaoGoogle(
    perfil: { id?: string; name?: string; email: string; foto?: string },
    idTokenReal?: string
  ): Promise<UsuarioAutenticado> {
    const emailLimpo = perfil.email.trim().toLowerCase();
    const nomeLimpo = (perfil.name || '').trim() || emailLimpo.split('@')[0];
    const tokenFinal = idTokenReal || `token_sessao_google_mobile_${Date.now()}`;

    const perfilFinal = {
      id: perfil.id || `usr_google_${emailLimpo.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: nomeLimpo,
      email: emailLimpo,
      foto: perfil.foto || '',
    };

    // 1. Garante que o Firebase Auth tenha sessão ativa (auth.currentUser)
    if (auth && !auth.currentUser) {
      try {
        const credAnonima = await signInAnonymously(auth);
        if (credAnonima?.user) {
          await updateProfile(credAnonima.user, {
            displayName: perfilFinal.name,
            photoURL: perfilFinal.foto || undefined,
          });
        }
      } catch (fbErr) {
        console.warn('[Firebase Auth] Sessão local ativa:', fbErr);
      }
    }

    // 2. Salva localmente para persistência no dispositivo
    await this.salvarContaGoogleDispositivo(perfilFinal);
    const sessaoLocal: UsuarioAutenticado = {
      id_usuario: perfilFinal.id,
      nome_usuario: perfilFinal.name,
      email_usuario: perfilFinal.email,
      nivel_acesso_permissao: 'funcionario_operador',
      url_foto_perfil: perfilFinal.foto,
      provedor_autenticacao: 'google',
    };
    await this.salvarSessaoLocal(sessaoLocal);

    // 3. Registra a sessão ativa diretamente na coleção tb_sessoesUsuarios do Firebase Firestore
    if (db) {
      try {
        const uidFirestore = auth?.currentUser?.uid || perfilFinal.id;
        await setDoc(
          doc(db, 'tb_sessoesUsuarios', uidFirestore),
          {
            id_usuario: uidFirestore,
            email_usuario: perfilFinal.email,
            nome_usuario: perfilFinal.name,
            url_foto_perfil: perfilFinal.foto || '',
            nivel_acesso_permissao: 'funcionario_operador',
            plataforma_acesso: Platform.OS === 'web' ? 'portal_web' : 'mobile_android',
            status_sessao_ativa: true,
            data_hora_inicio_sessao: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('[Firestore tb_sessoesUsuarios] Aviso ao gravar sessão:', fsErr);
      }
    }

    // 4. Sincroniza com o backend AWS
    try {
      return await this.sincronizarUsuarioComBackend(
        tokenFinal,
        perfilFinal,
        Platform.OS === 'web' ? 'portal_web' : 'mobile_android'
      );
    } catch (apiErr) {
      console.warn('[AWS Lambda] Contingência de login:', apiErr);
      return sessaoLocal;
    }
  },

  /**
   * Processa o id_token e/ou access_token recebidos do Google OAuth no Mobile,
   * autentica no Firebase Auth via signInWithCredential e obtém o Firebase ID Token.
   */
  async autenticarComTokensGoogle(
    idTokenRecebido?: string,
    accessTokenRecebido?: string
  ): Promise<UsuarioAutenticado | null> {
    if (!idTokenRecebido && !accessTokenRecebido) return null;
    if (_processandoRedirectGoogle) return null;
    _processandoRedirectGoogle = true;

    try {
      const perfilUsuario = {
        id: '',
        name: '',
        email: '',
        foto: '',
      };

      // 1. Tenta buscar informações detalhadas do perfil via Google UserInfo API
      if (accessTokenRecebido) {
        try {
          const resInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessTokenRecebido}` },
          });
          if (resInfo.ok) {
            const dados = await resInfo.json();
            perfilUsuario.id = dados.sub || '';
            perfilUsuario.name = dados.name || dados.given_name || '';
            perfilUsuario.email = dados.email || '';
            perfilUsuario.foto = dados.picture || '';
          }
        } catch (errUser) {
          console.warn('[Google UserInfo] Aviso:', errUser);
        }
      }

      // 2. Se não obtiver pelo UserInfo, decodifica o payload do id_token (JWT)
      if ((!perfilUsuario.email || !perfilUsuario.name) && idTokenRecebido) {
        const jwtData = decodificarPayloadJwt(idTokenRecebido);
        if (jwtData) {
          if (!perfilUsuario.id) perfilUsuario.id = jwtData.sub || '';
          if (!perfilUsuario.name) perfilUsuario.name = jwtData.name || jwtData.given_name || '';
          if (!perfilUsuario.email) perfilUsuario.email = jwtData.email || '';
          if (!perfilUsuario.foto) perfilUsuario.foto = jwtData.picture || '';
        }
      }

      // 3. Autentica no Firebase com a credencial Google obtida e extrai o Firebase ID Token
      let tokenParaBackend = idTokenRecebido || accessTokenRecebido || '';
      if ((idTokenRecebido || accessTokenRecebido) && auth) {
        try {
          const credential = GoogleAuthProvider.credential(
            idTokenRecebido || null,
            accessTokenRecebido || undefined
          );
          const credencialFirebase = await signInWithCredential(auth, credential);
          if (credencialFirebase.user) {
            tokenParaBackend = await credencialFirebase.user.getIdToken();
            if (!perfilUsuario.id) perfilUsuario.id = credencialFirebase.user.uid;
            if (!perfilUsuario.name) {
              perfilUsuario.name = credencialFirebase.user.displayName || perfilUsuario.name;
            }
            if (!perfilUsuario.email) {
              perfilUsuario.email = credencialFirebase.user.email || perfilUsuario.email;
            }
            if (!perfilUsuario.foto) {
              perfilUsuario.foto = credencialFirebase.user.photoURL || perfilUsuario.foto;
            }
          }
        } catch (fbErr) {
          console.warn('[Firebase Auth] Erro ao autenticar credencial Google:', fbErr);
        }
      }

      if (!perfilUsuario.email) {
        throw new Error('Não foi possível identificar o e-mail da conta Google selecionada.');
      }

      return await this.finalizarSessaoGoogle(perfilUsuario, tokenParaBackend);
    } finally {
      _processandoRedirectGoogle = false;
    }
  },
};
