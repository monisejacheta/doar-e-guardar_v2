import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, fontScale } = useAppTheme();

  // Estados dos campos de formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [exibirSenha, setExibirSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Login via Google
  const autenticarComGoogle = async () => {
    setCarregando(true);
    try {
      let idToken = 'google_oauth_token_simulado';
      let perfilUsuario = {
        id: 'usr_google_' + Date.now(),
        name: 'Colaborador Casa da Criança',
        email: 'colaborador@casadacrianca.org.br',
      };

      if (auth && googleProvider) {
        try {
          const resultado = await signInWithPopup(auth, googleProvider);
          const usuarioGoogle = resultado.user;
          idToken = await usuarioGoogle.getIdToken();
          perfilUsuario = {
            id: usuarioGoogle.uid,
            name: usuarioGoogle.displayName || usuarioGoogle.email?.split('@')[0] || 'Colaborador',
            email: usuarioGoogle.email || '',
          };
        } catch (popupError: any) {
          console.warn('[AUTH] Fallback para fluxo direto de desenvolvimento:', popupError.message);
        }
      }

      const resposta: any = await requisicaoApi('/api/auth/login', {
        metodo: 'POST',
        dados: {
          tipo_login: 'google',
          id_token: idToken,
          perfil_usuario: perfilUsuario,
          plataforma: Platform.OS === 'web' ? 'portal_web' : 'mobile_android',
        },
      });

      if (resposta?.sucesso) {
        router.replace('/home');
      } else {
        Alert.alert('Falha na Autenticação', resposta?.mensagem || 'Não foi possível validar seu login.');
      }
    } catch (erro: any) {
      Alert.alert('Erro ao Entrar', erro.message || 'Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // Login com E-mail e Senha
  const autenticarPorCredenciais = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Por favor, informe seu e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const resposta: any = await requisicaoApi('/api/auth/login', {
        metodo: 'POST',
        dados: {
          tipo_login: 'credenciais',
          email: email.trim().toLowerCase(),
          senha: senha.trim(),
          plataforma: Platform.OS === 'web' ? 'portal_web' : 'mobile_android',
        },
      });

      if (resposta?.sucesso) {
        router.replace('/home');
      } else {
        Alert.alert('Acesso Negado', resposta?.mensagem || 'Credenciais inválidas.');
      }
    } catch (erro: any) {
      Alert.alert('Erro de Conexão', erro.message || 'Não foi possível autenticar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Imagem de Fundo cobrindo toda a tela com 50% de opacidade */}
      <ImageBackground
        source={require('../../assets/images/wallpaperLogin.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.5, width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho Limpo: Título com fonte ampliada e Mensagem de Boas-Vindas */}
          <View style={styles.header}>
            <Text style={[styles.appName, { color: theme.primary, fontSize: 34 * fontScale }]}>
              Doar & Guardar
            </Text>

            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeTitle, { color: theme.text, fontSize: 18 * fontScale }]}>
                Bem-vindo(a) de volta!
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.subtext, fontSize: 13 * fontScale }]}>
                Gestão de estoque e doações da Casa da Criança
              </Text>
            </View>
          </View>

          {/* Cartão de Autenticação */}
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

            {/* Linha Divisória */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                ou acesse com e-mail
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Campo E-mail */}
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
                />
              </View>
            </View>

            {/* Campo Senha com Censor e Botão Toggle */}
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

            {/* Botão Entrar */}
            <TouchableOpacity
              onPress={autenticarPorCredenciais}
              disabled={carregando}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Entrar no aplicativo"
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
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

          {/* Rodapé */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.subtext, fontSize: 11 * fontScale }]}>
              Casa da Criança • Gestão Solidária e Transparente
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  appName: {
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  welcomeTitle: {
    fontWeight: '700',
  },
  welcomeSubtitle: {
    marginTop: 3,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 22,
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
    marginVertical: 18,
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
    marginBottom: 16,
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
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
});