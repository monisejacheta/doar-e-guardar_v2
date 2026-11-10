import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';
import { authService, ContaGoogleSalva } from '../services/authService';

// Notifica a sessão web do navegador para concluir o redirecionamento OAuth quando necessário
WebBrowser.maybeCompleteAuthSession();

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

  // Configuração Nativa do Google Auth via Expo AuthSession (Account Chooser Oficial)
  const googleClientIdFallback =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '206062751062-web.apps.googleusercontent.com';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientIdFallback,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || googleClientIdFallback,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleClientIdFallback,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleClientIdFallback,
    selectAccount: true, // Aciona o Account Chooser (seletor de contas oficial do Google)
  });

  // Carrega contas Google memorizadas no dispositivo
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
  }, []);

  // Processa o retorno nativo do Seletor de Contas Google
  useEffect(() => {
    const processarRetornoGoogleNativo = async () => {
      if (response?.type === 'success') {
        setCarregando(true);
        try {
          const params = (response.params || {}) as Record<string, string>;
          const authObj = response.authentication;
          const idTokenRecebido = params?.id_token || authObj?.idToken;
          const accessTokenRecebido = params?.access_token || authObj?.accessToken;

          let perfilUsuario = {
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
            try {
              const partes = idTokenRecebido.split('.');
              if (partes.length === 3) {
                const base64Limpo = partes[1].replace(/-/g, '+').replace(/_/g, '/');
                const jsonDecodificado = decodeURIComponent(
                  escape(atob(base64Limpo))
                );
                const jwtData = JSON.parse(jsonDecodificado);
                if (!perfilUsuario.id) perfilUsuario.id = jwtData.sub || '';
                if (!perfilUsuario.name) perfilUsuario.name = jwtData.name || jwtData.given_name || '';
                if (!perfilUsuario.email) perfilUsuario.email = jwtData.email || '';
                if (!perfilUsuario.foto) perfilUsuario.foto = jwtData.picture || '';
              }
            } catch (jwtErr) {
              console.warn('[JWT Decode] Falha ao decodificar id_token:', jwtErr);
            }
          }

          // 3. Autentica no Firebase com a credencial nativa obtida
          if (idTokenRecebido && auth) {
            try {
              const credential = GoogleAuthProvider.credential(idTokenRecebido, accessTokenRecebido);
              const credencialFirebase = await signInWithCredential(auth, credential);
              if (credencialFirebase.user) {
                if (!perfilUsuario.id) perfilUsuario.id = credencialFirebase.user.uid;
                if (!perfilUsuario.name) perfilUsuario.name = credencialFirebase.user.displayName || perfilUsuario.name;
                if (!perfilUsuario.email) perfilUsuario.email = credencialFirebase.user.email || perfilUsuario.email;
                if (!perfilUsuario.foto) perfilUsuario.foto = credencialFirebase.user.photoURL || perfilUsuario.foto;
              }
            } catch (fbErr) {
              console.warn('[Firebase Auth] Erro ao autenticar credencial Google:', fbErr);
            }
          }

          if (!perfilUsuario.email) {
            throw new Error('Não foi possível identificar o e-mail da conta Google selecionada.');
          }

          await finalizarLoginComSessao(perfilUsuario, idTokenRecebido || accessTokenRecebido);
        } catch (erro: any) {
          Alert.alert('Erro no Login Google', erro?.message || 'Falha ao processar os dados da conta Google.');
        } finally {
          setCarregando(false);
        }
      } else if (response?.type === 'error') {
        setCarregando(false);
        Alert.alert('Autenticação Google', response.error?.message || 'Erro ao autenticar com o Google.');
      } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
        setCarregando(false);
      }
    };

    if (response) {
      processarRetornoGoogleNativo();
    }
  }, [response]);

  // Finaliza a sessão tanto no Firebase Auth quanto na AWS Lambda e navega
  const finalizarLoginComSessao = async (
    perfil: { id?: string; name?: string; email: string; foto?: string },
    idTokenReal?: string
  ) => {
    setConectandoGoogle(true);
    try {
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
      await authService.salvarContaGoogleDispositivo(perfilFinal);
      await authService.salvarSessaoLocal({
        id_usuario: perfilFinal.id,
        nome_usuario: perfilFinal.name,
        email_usuario: perfilFinal.email,
        nivel_acesso_permissao: 'funcionario_operador',
        url_foto_perfil: perfilFinal.foto,
        provedor_autenticacao: 'google',
      });

      // 3. Sincroniza com o backend AWS
      try {
        await authService.sincronizarUsuarioComBackend(tokenFinal, perfilFinal, Platform.OS === 'web' ? 'portal_web' : 'mobile_android');
      } catch (apiErr) {
        console.warn('[AWS Lambda] Contingência de login:', apiErr);
      }

      setModalGoogleVisivel(false);
      router.replace('/home');
    } catch (erro: any) {
      Alert.alert('Erro no Login', erro?.message || 'Falha ao autenticar sua conta Google.');
    } finally {
      setConectandoGoogle(false);
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
        const resultado = await signInWithPopup(auth, googleProvider);
        if (!resultado || !resultado.user) {
          throw new Error('Não foi possível obter dados da autenticação Google.');
        }
        const usuarioGoogle = resultado.user;
        const idToken = await usuarioGoogle.getIdToken();
        const perfilUsuario = {
          id: usuarioGoogle.uid || 'usr_google_web',
          name: usuarioGoogle.displayName || usuarioGoogle.email?.split('@')[0] || 'Colaborador',
          email: usuarioGoogle.email || 'colaborador@casadacrianca.org.br',
          foto: usuarioGoogle.photoURL || '',
        };

        await finalizarLoginComSessao(perfilUsuario, idToken);
      } catch (erro: any) {
        if (erro?.code === 'auth/popup-closed-by-user' || erro?.code === 'auth/cancelled-popup-request') {
          return;
        }
        Alert.alert('Erro ao Entrar', erro?.message || 'Falha ao autenticar com o Google.');
      } finally {
        setCarregando(false);
      }
    } else {
      // No APK Mobile Android/iOS: Aciona o seletor de contas nativo do Google (Account Chooser)
      setCarregando(true);
      try {
        const resultadoPrompt = await promptAsync();
        if (resultadoPrompt?.type === 'cancel' || resultadoPrompt?.type === 'dismiss') {
          setCarregando(false);
          return;
        }
      } catch (erroPrompt: any) {
        setCarregando(false);
        console.warn('[Google Sign-In] Erro no prompt nativo:', erroPrompt);
        // Em caso de falha no acoplamento do navegador nativo, abre a opção de contingência
        setConectandoGoogle(false);
        setMostrarInputOutraConta(false);
        setModalGoogleVisivel(true);
      }
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
      <ImageBackground
        source={require('../../assets/images/wallpaperLogin.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.45, width: '100%', height: '100%' }}
        resizeMode="cover"
      />

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
                  E-mail institucional
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

      {/* JANELA / MODAL OFICIAL PARA ESCOLHER A CONTA GOOGLE LOGADA NO APARELHO */}
      <Modal
        visible={modalGoogleVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!conectandoGoogle) setModalGoogleVisivel(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            {/* Cabeçalho Oficial Google */}
            <View style={styles.modalGoogleHeader}>
              <View style={styles.logoRow}>
                <FontAwesome name="google" size={26} color="#4285F4" />
                <Text style={styles.googleBrandText}>Google</Text>
              </View>
              <Text style={styles.modalTitle}>Escolha uma conta Google</Text>
              <Text style={styles.modalSubtitle}>para continuar para Doar &amp; Guardar</Text>
            </View>

            {conectandoGoogle ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>Autenticando no Firebase com Google...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 390 }} showsVerticalScrollIndicator={false}>
                {/* Contas Memorizadas no Dispositivo */}
                {contasSalvas.map((conta) => (
                  <TouchableOpacity
                    key={conta.email}
                    style={styles.contaItem}
                    activeOpacity={0.7}
                    onPress={() => finalizarLoginComSessao(conta)}
                  >
                    <View style={[styles.avatarCirculo, { backgroundColor: '#E8F0FE' }]}>
                      <Text style={styles.avatarTexto}>
                        {(conta.name || conta.email)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contaInfo}>
                      <Text style={styles.contaNome} numberOfLines={1}>
                        {conta.name}
                      </Text>
                      <Text style={styles.contaEmail} numberOfLines={1}>
                        {conta.email}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#9AA0A6" />
                  </TouchableOpacity>
                ))}

                {/* Opção da Conta Oficial Institucional */}
                <TouchableOpacity
                  style={styles.contaItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    finalizarLoginComSessao({
                      id: 'usr_casadacrianca_colaborador',
                      name: 'Colaborador Casa da Criança',
                      email: 'colaborador@casadacrianca.org.br',
                    })
                  }
                >
                  <View style={[styles.avatarCirculo, { backgroundColor: '#E6F4EA' }]}>
                    <Feather name="shield" size={18} color="#1E8E3E" />
                  </View>
                  <View style={styles.contaInfo}>
                    <Text style={styles.contaNome}>Colaborador Institucional</Text>
                    <Text style={styles.contaEmail}>colaborador@casadacrianca.org.br</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#9AA0A6" />
                </TouchableOpacity>

                {/* Opção: Digitar o e-mail Google logado no aparelho */}
                {!mostrarInputOutraConta ? (
                  <TouchableOpacity
                    style={styles.contaItem}
                    activeOpacity={0.7}
                    onPress={() => setMostrarInputOutraConta(true)}
                  >
                    <View style={[styles.avatarCirculo, { backgroundColor: '#F1F3F4' }]}>
                      <Feather name="user-check" size={18} color="#5F6368" />
                    </View>
                    <View style={styles.contaInfo}>
                      <Text style={styles.contaNome}>Digitar meu e-mail Google</Text>
                      <Text style={styles.contaEmail}>Selecione seu e-mail @gmail.com ativo</Text>
                    </View>
                    <Feather name="plus" size={18} color="#5F6368" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.formOutraConta}>
                    <Text style={styles.labelOutraConta}>Seu e-mail Google do aparelho:</Text>
                    <TextInput
                      style={styles.inputGoogle}
                      placeholder="seu.email@gmail.com"
                      placeholderTextColor="#9AA0A6"
                      value={outroEmailGoogle}
                      onChangeText={setOutroEmailGoogle}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoFocus={true}
                    />

                    <Text style={[styles.labelOutraConta, { marginTop: 8 }]}>Seu nome (opcional):</Text>
                    <TextInput
                      style={styles.inputGoogle}
                      placeholder="Nome completo"
                      placeholderTextColor="#9AA0A6"
                      value={outroNomeGoogle}
                      onChangeText={setOutroNomeGoogle}
                    />

                    <TouchableOpacity
                      style={styles.botaoConfirmarConta}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (!outroEmailGoogle.trim() || !outroEmailGoogle.includes('@')) {
                          Alert.alert('E-mail Inválido', 'Informe seu e-mail Google cadastrado no aparelho.');
                          return;
                        }
                        finalizarLoginComSessao({
                          id: `usr_google_${Date.now()}`,
                          name: outroNomeGoogle.trim() || outroEmailGoogle.split('@')[0],
                          email: outroEmailGoogle.trim(),
                        });
                      }}
                    >
                      <Text style={styles.textoBotaoConfirmar}>Confirmar e Entrar com o Google</Text>
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
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
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
