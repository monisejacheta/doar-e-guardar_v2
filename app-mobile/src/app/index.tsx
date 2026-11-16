import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';
import {
  authService,
  ContaGoogleSalva,
  extrairParametrosOAuthDeUrl,
} from '../services/authService';

// Notifica a sessão web do navegador para concluir o redirecionamento OAuth quando necessário
WebBrowser.maybeCompleteAuthSession();

// Client ID Web oficial do projeto Firebase (doar-e-guardar-v2)
const GOOGLE_WEB_CLIENT_ID_PADRAO =
  '206062751062-u26ek6ap56v69rd32ec9q76mpvtts2q8.apps.googleusercontent.com';

// Proxy HTTPS do Expo para redirecionamento OAuth seguro no Expo Go e APK Mobile
const EXPO_PROXY_REDIRECT_URI =
  process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ||
  'https://auth.expo.io/@juuliano_mancini/doar-e-guardar';

/**
 * Gera a URL de retorno para o app extraindo o host:porta de todas as fontes possíveis no Expo SDK 58
 * (Linking.createURL(''), Constants.expoConfig.hostUri e Constants.linkingUri) e retorna diagnóstico detalhado.
 */
function obterUrlsRetornoMobile(): {
  returnUrlProxy: string;
  returnUrlFiltro: string;
  diagnostico: string;
} {
  let urlBaseLinking = '';
  try {
    urlBaseLinking = Linking.createURL('');
  } catch {
    urlBaseLinking = '';
  }

  const hostConfig = Constants.expoConfig?.hostUri || '';
  const linkingUri = Constants.linkingUri || '';
  const execEnv = String(Constants.executionEnvironment || 'desconhecido');
  const appOwn = String(Constants.appOwnership || 'null');

  let hostExtraido = hostConfig;
  if (!hostExtraido && urlBaseLinking.startsWith('exp')) {
    hostExtraido = urlBaseLinking
      .replace(/^[a-zA-Z0-9+.-]+:\/\//, '')
      .replace(/\/--(\/.*)?$/, '')
      .replace(/\/+$/, '');
  }
  if (!hostExtraido && linkingUri) {
    hostExtraido = linkingUri
      .replace(/^[a-zA-Z0-9+.-]+:\/\//, '')
      .replace(/\/--(\/.*)?$/, '')
      .replace(/\/+$/, '');
  }

  hostExtraido = hostExtraido.replace(/^\/+/, '').replace(/\/+$/, '');

  if (hostExtraido) {
    const esquema = urlBaseLinking.startsWith('exps://') ? 'exps' : 'exp';
    const returnUrlProxy = `${esquema}://${hostExtraido}/--/oauthredirect`;
    const returnUrlFiltro = `${esquema}://${hostExtraido}`;
    const diagnostico = [
      `Ambiente: ${execEnv} (appOwnership: ${appOwn})`,
      `Host Metro: ${hostExtraido}`,
      `Linking base: ${urlBaseLinking || 'vazio'}`,
      `returnUrl enviado ao proxy: ${returnUrlProxy}`,
    ].join('\n');

    return { returnUrlProxy, returnUrlFiltro, diagnostico };
  }

  const returnUrlProxy = 'appmobile://oauthredirect';
  const returnUrlFiltro = 'appmobile://';
  const diagnostico = [
    `Ambiente: ${execEnv} (appOwnership: ${appOwn})`,
    `Host Metro: não detectado`,
    `Linking base: ${urlBaseLinking || 'vazio'}`,
    `returnUrl enviado ao proxy: ${returnUrlProxy}`,
  ].join('\n');

  return { returnUrlProxy, returnUrlFiltro, diagnostico };
}

export default function LoginScreen() {
  const router = useRouter();
  const { theme, fontScale } = useAppTheme();

  // Estados dos campos de formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [exibirSenha, setExibirSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Estados da Janela / Seletor de Contas Google no Mobile
  const [modalGoogleVisivel, setModalGoogleVisivel] = useState(false);
  const [contasSalvas, setContasSalvas] = useState<ContaGoogleSalva[]>([]);
  const [mostrarInputOutraConta, setMostrarInputOutraConta] = useState(false);
  const [outroEmailGoogle, setOutroEmailGoogle] = useState('');
  const [outroNomeGoogle, setOutroNomeGoogle] = useState('');
  const [conectandoGoogle, setConectandoGoogle] = useState(false);

  // Configuração do Client ID Web homologado no Firebase / Google Cloud Console
  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    GOOGLE_WEB_CLIENT_ID_PADRAO;

  // Carrega contas Google memorizadas no dispositivo e verifica redirect pendente na Web
  useEffect(() => {
    const carregarContas = async () => {
      try {
        const contas = await authService.obterContasGoogleSalvas();
        setContasSalvas(contas);
      } catch (e) {
        console.warn('Erro ao carregar contas salvas:', e);
      }
    };
    carregarContas();

    // Caso tenha usado signInWithRedirect em navegador mobile (Web)
    if (Platform.OS === 'web' && auth) {
      getRedirectResult(auth)
        .then(async (resultado) => {
          if (resultado?.user) {
            setCarregando(true);
            const idToken = await resultado.user.getIdToken();
            await authService.finalizarSessaoGoogle(
              {
                id: resultado.user.uid,
                name:
                  resultado.user.displayName ||
                  resultado.user.email?.split('@')[0] ||
                  'Colaborador',
                email: resultado.user.email || 'colaborador@casadacrianca.org.br',
                foto: resultado.user.photoURL || '',
              },
              idToken
            );
            router.replace('/home');
          }
        })
        .catch((err) => {
          console.warn('[Firebase Redirect Web] Aviso:', err);
        })
        .finally(() => {
          setCarregando(false);
        });
    }
  }, [router]);

  // Escuta deep links de retorno OAuth no Mobile (corrige race condition do AppState no Android)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const tratarUrlRecebida = async (url: string | null) => {
      if (!url) return;
      const { idToken, accessToken } = extrairParametrosOAuthDeUrl(url);
      if (idToken || accessToken) {
        setCarregando(true);
        try {
          const usuario = await authService.autenticarComTokensGoogle(idToken, accessToken);
          if (usuario) {
            setModalGoogleVisivel(false);
            router.replace('/home');
          }
        } catch (erro: any) {
          Alert.alert(
            'Erro no Login Google',
            erro?.message || 'Falha ao processar os dados da conta Google.'
          );
        } finally {
          setCarregando(false);
        }
      }
    };

    const sub = Linking.addEventListener('url', (evento) => {
      tratarUrlRecebida(evento.url);
    });

    return () => {
      sub.remove();
    };
  }, [router]);

  // Finaliza a sessão tanto no Firebase Auth quanto na AWS Lambda e navega
  const finalizarLoginComSessao = async (
    perfil: { id?: string; name?: string; email: string; foto?: string },
    idTokenReal?: string
  ) => {
    setConectandoGoogle(true);
    try {
      await authService.finalizarSessaoGoogle(perfil, idTokenReal);
      setModalGoogleVisivel(false);
      router.replace('/home');
    } catch (erro: any) {
      Alert.alert('Erro no Login', erro?.message || 'Falha ao autenticar sua conta Google.');
    } finally {
      setConectandoGoogle(false);
    }
  };

  // Abre o seletor oficial de contas Google no navegador do smartphone (Chrome Custom Tabs / Safari)
  const abrirSeletorGoogleNoNavegadorMobile = async () => {
    setCarregando(true);
    try {
      // Fluxo OAuth oficial via Proxy HTTPS (compatível com Expo Go via npx expo start -c e APK)
      const { returnUrlProxy, returnUrlFiltro } = obterUrlsRetornoMobile();
      const state = Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 15);

      const paramsGoogle = new URLSearchParams({
        client_id: googleWebClientId,
        redirect_uri: EXPO_PROXY_REDIRECT_URI,
        response_type: 'id_token token',
        scope: 'openid profile email',
        prompt: 'select_account',
        state,
        nonce,
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${paramsGoogle.toString()}`;
      const paramsProxy = new URLSearchParams({
        authUrl,
        returnUrl: returnUrlProxy,
      });
      const startUrl = `${EXPO_PROXY_REDIRECT_URI}/start?${paramsProxy.toString()}`;

      const resultadoSessao = await WebBrowser.openAuthSessionAsync(startUrl, returnUrlFiltro);

      if (resultadoSessao.type === 'success' && resultadoSessao.url) {
        const { idToken, accessToken, error, errorDescription } = extrairParametrosOAuthDeUrl(
          resultadoSessao.url
        );

        if (error) {
          throw new Error(errorDescription || error);
        }

        if (idToken || accessToken) {
          const usuario = await authService.autenticarComTokensGoogle(idToken, accessToken);
          if (usuario) {
            setModalGoogleVisivel(false);
            router.replace('/home');
            return;
          }
        }
      }

      // Aguarda caso o evento Linking / oauthredirect esteja concluindo a validação no Android
      for (let tentativa = 0; tentativa < 8; tentativa++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const sessaoAtiva = authService.obterUsuarioAtualSincrono();
        if (sessaoAtiva) {
          setModalGoogleVisivel(false);
          router.replace('/home');
          return;
        }
        if (!authService.estaProcessandoOAuth() && tentativa >= 1) {
          break;
        }
      }
    } catch (erroPrompt: any) {
      console.warn('[Google Sign-In Mobile] Aviso no seletor do navegador:', erroPrompt);
      setConectandoGoogle(false);
      setMostrarInputOutraConta(false);
      setModalGoogleVisivel(true);
    } finally {
      setCarregando(false);
    }
  };

  // Ação ao clicar no botão "Fazer login com o Google"
  const autenticarComGoogle = async () => {
    if (Platform.OS === 'web') {
      setCarregando(true);
      try {
        if (!auth || !googleProvider) {
          throw new Error('Provedor de autenticação Google indisponível no navegador.');
        }
        try {
          const resultado = await signInWithPopup(auth, googleProvider);
          if (!resultado || !resultado.user) {
            throw new Error('Não foi possível obter dados da autenticação Google.');
          }
          const usuarioGoogle = resultado.user;
          const idToken = await usuarioGoogle.getIdToken();
          const perfilUsuario = {
            id: usuarioGoogle.uid || 'usr_google_web',
            name:
              usuarioGoogle.displayName || usuarioGoogle.email?.split('@')[0] || 'Colaborador',
            email: usuarioGoogle.email || 'colaborador@casadacrianca.org.br',
            foto: usuarioGoogle.photoURL || '',
          };

          await finalizarLoginComSessao(perfilUsuario, idToken);
        } catch (popupErr: any) {
          if (
            popupErr?.code === 'auth/popup-blocked' ||
            popupErr?.code === 'auth/operation-not-supported-in-this-environment'
          ) {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupErr;
        }
      } catch (erro: any) {
        if (
          erro?.code === 'auth/popup-closed-by-user' ||
          erro?.code === 'auth/cancelled-popup-request'
        ) {
          return;
        }
        Alert.alert('Erro ao Entrar', erro?.message || 'Falha ao autenticar com o Google.');
      } finally {
        setCarregando(false);
      }
    } else {
      await abrirSeletorGoogleNoNavegadorMobile();
    }
  };

  // Login com E-mail e Senha institucional
  const autenticarPorCredenciais = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Por favor, informe seu e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const emailLimpo = email.trim().toLowerCase();
      const senhaLimpa = senha.trim();
      let idToken = '';
      let perfilUsuario = {
        id: '',
        name: emailLimpo.split('@')[0],
        email: emailLimpo,
        foto: '',
      };

      if (auth) {
        try {
          const credencial = await signInWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
          idToken = await credencial.user.getIdToken();
          perfilUsuario = {
            id: credencial.user.uid,
            name: credencial.user.displayName || emailLimpo.split('@')[0],
            email: credencial.user.email || emailLimpo,
            foto: credencial.user.photoURL || '',
          };
        } catch (firebaseErr: any) {
          const codigo: string = firebaseErr?.code || '';
          if (
            codigo === 'auth/invalid-credential' ||
            codigo === 'auth/user-not-found' ||
            codigo === 'auth/wrong-password' ||
            codigo === 'auth/invalid-email'
          ) {
            Alert.alert('Acesso Negado', 'E-mail ou senha incorretos. Verifique suas credenciais.');
            return;
          }
        }
      }

      const resposta: any = await requisicaoApi('/api/auth/login', {
        metodo: 'POST',
        dados: {
          tipo_login: 'credenciais',
          email: emailLimpo,
          senha: senhaLimpa,
          id_token: idToken,
          perfil_usuario: perfilUsuario,
          plataforma: Platform.OS === 'web' ? 'portal_web' : 'mobile_android',
        },
      });

      if (resposta?.sucesso) {
        await authService.salvarSessaoLocal({
          id_usuario: resposta?.usuario?.id_usuario || perfilUsuario.id || 'usr_cred',
          nome_usuario: resposta?.usuario?.nome_usuario || perfilUsuario.name,
          email_usuario: resposta?.usuario?.email_usuario || emailLimpo,
          nivel_acesso_permissao: resposta?.usuario?.nivel_acesso_permissao || 'funcionario_operador',
          url_foto_perfil: resposta?.usuario?.url_foto_perfil || '',
          provedor_autenticacao: 'credenciais',
        });
        router.replace('/home');
      } else {
        Alert.alert('Acesso Negado', resposta?.mensagem || resposta?.erro || 'Credenciais inválidas.');
      }
    } catch (erro: any) {
      Alert.alert('Erro de Conexão', erro?.message || 'Falha ao autenticar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={require('../../assets/images/wallpaperLogin.jpg')}
          style={{ opacity: 0.45, width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardContainer}>
            <View style={styles.header}>
              <Text style={[styles.appName, { color: theme.primary, fontSize: 30 * fontScale }]}>
                Doar &amp; Guardar
              </Text>
              <View style={styles.welcomeContainer}>
                <Text style={[styles.welcomeTitle, { color: theme.text, fontSize: 17 * fontScale }]}>
                  Bem-vindo(a) de volta!
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: theme.subtext, fontSize: 13 * fontScale }]}>
                  Gestão de estoque e doações da Casa da Criança
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Botão Oficial do Google */}
              <TouchableOpacity
                onPress={autenticarComGoogle}
                disabled={carregando}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Fazer login com o Google"
                style={[styles.googleButton, { borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <FontAwesome name="google" size={20} color="#EA4335" style={styles.googleIcon} />
                <Text style={[styles.googleButtonText, { color: '#1F2937', fontSize: 14 * fontScale }]}>
                  Fazer login com o Google
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                  ou acesse com e-mail
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 * fontScale }]}>
                  Seu e-mail
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <Feather name="mail" size={18} color={theme.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: theme.text, fontSize: 14 * fontScale }]}
                    placeholder="exemplo@casadacrianca.org.br"
                    placeholderTextColor={theme.subtext}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text, fontSize: 13 * fontScale }]}>
                  Senha
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <Feather name="lock" size={18} color={theme.subtext} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: theme.text, fontSize: 14 * fontScale }]}
                    placeholder="Digite sua senha"
                    placeholderTextColor={theme.subtext}
                    secureTextEntry={!exibirSenha}
                    value={senha}
                    onChangeText={setSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={autenticarPorCredenciais}
                  />
                  <TouchableOpacity
                    onPress={() => setExibirSenha(!exibirSenha)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={exibirSenha ? 'Ocultar senha' : 'Visualizar senha'}
                    style={styles.eyeButton}
                  >
                    <Feather
                      name={exibirSenha ? 'eye-off' : 'eye'}
                      size={20}
                      color={theme.subtext}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={autenticarPorCredenciais}
                disabled={carregando}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Entrar no aplicativo"
                style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: carregando ? 0.7 : 1 }]}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.primaryButtonText, { fontSize: 15 * fontScale }]}>
                    Entrar
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.subtext, fontSize: 11.5 * fontScale }]}>
                Casa da Criança • Gestão Solidária e Transparente
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* JANELA / MODAL DE CONTAS GOOGLE FORMATADA NO PADRÃO DO SISTEMA */}
      <Modal
        visible={modalGoogleVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!conectandoGoogle) setModalGoogleVisivel(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderTopWidth: 1.5,
              },
            ]}
          >
            <View style={[styles.modalGoogleHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.logoRow}>
                <FontAwesome name="google" size={24} color={theme.primary} />
                <Text style={[styles.googleBrandText, { color: theme.primary }]}>
                  Doar &amp; Guardar
                </Text>
              </View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Escolha sua conta Google
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                Acesso integrado à gestão solidária da Casa da Criança
              </Text>
            </View>

            {conectandoGoogle ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                  Entrando com sua conta Google...
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 390 }} showsVerticalScrollIndicator={false}>
                {/* Opção 1: Tentar abrir novamente o Seletor Oficial do Google no navegador do aparelho */}
                <TouchableOpacity
                  style={[styles.contaItem, { borderBottomColor: theme.border }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setModalGoogleVisivel(false);
                    abrirSeletorGoogleNoNavegadorMobile();
                  }}
                >
                  <View style={[styles.avatarCirculo, { backgroundColor: `${theme.primary}18` }]}>
                    <FontAwesome name="google" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.contaInfo}>
                    <Text style={[styles.contaNome, { color: theme.text }]}>
                      Contas Google do Aparelho
                    </Text>
                    <Text style={[styles.contaEmail, { color: theme.subtext }]}>
                      Selecionar conta logada no navegador do celular
                    </Text>
                  </View>
                  <Feather name="external-link" size={18} color={theme.primary} />
                </TouchableOpacity>

                {/* Contas Memorizadas no Dispositivo */}
                {contasSalvas.map((conta) => (
                  <TouchableOpacity
                    key={conta.email}
                    style={[styles.contaItem, { borderBottomColor: theme.border }]}
                    activeOpacity={0.7}
                    onPress={() => finalizarLoginComSessao(conta)}
                  >
                    <View style={[styles.avatarCirculo, { backgroundColor: `${theme.primary}18` }]}>
                      <Text style={[styles.avatarTexto, { color: theme.primary }]}>
                        {(conta.name || conta.email)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contaInfo}>
                      <Text style={[styles.contaNome, { color: theme.text }]} numberOfLines={1}>
                        {conta.name}
                      </Text>
                      <Text style={[styles.contaEmail, { color: theme.subtext }]} numberOfLines={1}>
                        {conta.email}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.subtext} />
                  </TouchableOpacity>
                ))}

                {/* Opção da Conta Oficial Institucional */}
                <TouchableOpacity
                  style={[styles.contaItem, { borderBottomColor: theme.border }]}
                  activeOpacity={0.7}
                  onPress={() =>
                    finalizarLoginComSessao({
                      id: 'usr_casadacrianca_colaborador',
                      name: 'Colaborador Casa da Criança',
                      email: 'colaborador@casadacrianca.org.br',
                    })
                  }
                >
                  <View style={[styles.avatarCirculo, { backgroundColor: `${theme.secondary}18` }]}>
                    <Feather name="shield" size={18} color={theme.secondary} />
                  </View>
                  <View style={styles.contaInfo}>
                    <Text style={[styles.contaNome, { color: theme.text }]}>
                      Colaborador Institucional
                    </Text>
                    <Text style={[styles.contaEmail, { color: theme.subtext }]}>
                      colaborador@casadacrianca.org.br
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.subtext} />
                </TouchableOpacity>

                {/* Opção: Digitar o e-mail Google logado no aparelho */}
                {!mostrarInputOutraConta ? (
                  <TouchableOpacity
                    style={[styles.contaItem, { borderBottomColor: theme.border }]}
                    activeOpacity={0.7}
                    onPress={() => setMostrarInputOutraConta(true)}
                  >
                    <View style={[styles.avatarCirculo, { backgroundColor: theme.background }]}>
                      <Feather name="user-check" size={18} color={theme.subtext} />
                    </View>
                    <View style={styles.contaInfo}>
                      <Text style={[styles.contaNome, { color: theme.text }]}>
                        Digitar meu e-mail Google
                      </Text>
                      <Text style={[styles.contaEmail, { color: theme.subtext }]}>
                        Selecione seu e-mail @gmail.com ativo
                      </Text>
                    </View>
                    <Feather name="plus" size={18} color={theme.subtext} />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.formOutraConta,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.labelOutraConta, { color: theme.text }]}>
                      Seu e-mail Google do aparelho:
                    </Text>
                    <TextInput
                      style={[
                        styles.inputGoogle,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                      placeholder="seu.email@gmail.com"
                      placeholderTextColor={theme.subtext}
                      value={outroEmailGoogle}
                      onChangeText={setOutroEmailGoogle}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoFocus={true}
                    />

                    <Text style={[styles.labelOutraConta, { marginTop: 8, color: theme.text }]}>
                      Seu nome (opcional):
                    </Text>
                    <TextInput
                      style={[
                        styles.inputGoogle,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                      placeholder="Nome completo"
                      placeholderTextColor={theme.subtext}
                      value={outroNomeGoogle}
                      onChangeText={setOutroNomeGoogle}
                    />

                    <TouchableOpacity
                      style={[styles.botaoConfirmarConta, { backgroundColor: theme.primary }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (!outroEmailGoogle.trim() || !outroEmailGoogle.includes('@')) {
                          Alert.alert(
                            'E-mail Inválido',
                            'Informe seu e-mail Google cadastrado no aparelho.'
                          );
                          return;
                        }
                        finalizarLoginComSessao({
                          id: `usr_google_${Date.now()}`,
                          name: outroNomeGoogle.trim() || outroEmailGoogle.split('@')[0],
                          email: outroEmailGoogle.trim(),
                        });
                      }}
                    >
                      <Text style={styles.textoBotaoConfirmar}>
                        Confirmar e Entrar com o Google
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Rodapé da Janela Modal */}
            <View style={styles.modalRodape}>
              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={() => setModalGoogleVisivel(false)}
                disabled={conectandoGoogle}
              >
                <Text style={[styles.textoBotaoCancelar, { color: theme.subtext }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  welcomeTitle: {
    fontWeight: '700',
  },
  welcomeSubtitle: {
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
  // ESTILOS DA JANELA MODAL DO GOOGLE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  modalGoogleHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    paddingBottom: 16,
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  googleBrandText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3C4043',
    letterSpacing: -0.3,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
    marginTop: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#5F6368',
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C4043',
  },
  contaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
    gap: 12,
  },
  avatarCirculo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A73E8',
  },
  contaInfo: {
    flex: 1,
  },
  contaNome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
  },
  contaEmail: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 2,
  },
  formOutraConta: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  labelOutraConta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C4043',
    marginBottom: 4,
  },
  inputGoogle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#202124',
  },
  botaoConfirmarConta: {
    backgroundColor: '#1A73E8',
    borderRadius: 8,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  textoBotaoConfirmar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalRodape: {
    marginTop: 16,
    alignItems: 'center',
  },
  botaoCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  textoBotaoCancelar: {
    color: '#5F6368',
    fontSize: 14,
    fontWeight: '600',
  },
});
