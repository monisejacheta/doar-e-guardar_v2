// app-mobile/src/app/index.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';

export default function IndexLoginScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Login Oficial Google Identity via Popup (RF02 / Tela 01)
  const autenticarComGoogle = async () => {
    setCarregando(true);
    try {
      // 1. Abre a janela do Google para você selecionar sua conta real
      const resultado = await signInWithPopup(auth, googleProvider);
      const usuarioGoogle = resultado.user;

      console.log('[LOGIN GOOGLE REAL] Usuário:', usuarioGoogle.displayName, usuarioGoogle.email);

      // 2. Extrai o ID Token JWT oficial
      const idTokenReal = await usuarioGoogle.getIdToken();

      // 3. Envia os dados reais da sua conta para o backend
      const resposta: any = await requisicaoApi('/api/auth/login', {
        metodo: 'POST',
        dados: {
          tipo_login: 'google',
          id_token: idTokenReal,
          perfil_usuario: {
            id: usuarioGoogle.uid,
            name: usuarioGoogle.displayName || usuarioGoogle.email?.split('@')[0],
            email: usuarioGoogle.email,
            foto: usuarioGoogle.photoURL,
          },
          plataforma: Platform.OS === 'web' ? 'portal_web' : 'mobile_android',
        },
      });

      if (resposta?.sucesso) {
        roteador.replace('/home');
      } else {
        Alert.alert('Falha na Autenticação', resposta?.mensagem || 'Erro ao validar login.');
      }
    } catch (erro: any) {
      console.error('[ERRO GOOGLE AUTH]', erro);
      Alert.alert('Erro ao autenticar com o Google', erro.message);
    } finally {
      setCarregando(false);
    }
  };

  const autenticarPorCredenciais = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Campos Obrigatórios', 'Informe seu e-mail institucional e senha para entrar.');
      return;
    }

    setCarregando(true);
    try {
      const resposta: any = await requisicaoApi('/api/auth/login', {
        metodo: 'POST',
        dados: {
          tipo_login: 'google',
          perfil_usuario: {
            id: `usr_${email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: email.split('@')[0],
            email: email.trim().toLowerCase(),
          },
          plataforma: Platform.OS === 'web' ? 'portal_web' : 'mobile_android',
        },
      });

      if (resposta?.sucesso) {
        roteador.replace('/home');
      } else {
        Alert.alert('Acesso Negado', resposta?.mensagem || 'Credenciais inválidas.');
      }
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Falha ao autenticar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logotipo Oficial Casinha de Caixas */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: theme.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
                marginBottom: 12,
              }}
              accessible={true}
              accessibilityLabel="Logotipo Casinha de Caixas da Casa da Criança"
            >
              <Text style={{ fontSize: 36 }}>🏠</Text>
            </View>

            <Text
              style={{
                fontWeight: '800',
                color: theme.primary,
                fontSize: tokens.typography.fontSize.xxl * fontScale,
                letterSpacing: -0.5,
              }}
            >
              Doar&Guardar
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: tokens.typography.fontSize.sm * fontScale,
                marginTop: 2,
              }}
            >
              Gestão de Estoque • Casa da Criança
            </Text>
          </View>

          {/* Card Central Limpo */}
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 20,
              padding: 22,
              borderWidth: 1.5,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color: theme.text,
                fontSize: 16 * fontScale,
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              Acesso dos Colaboradores
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 12 * fontScale,
                textAlign: 'center',
                marginBottom: 20,
                lineHeight: 18,
              }}
            >
              Entre com a sua conta Google para gerenciar os alimentos da instituição.
            </Text>

            {/* Botão Oficial Google Identity */}
            <TouchableOpacity
              onPress={autenticarComGoogle}
              disabled={carregando}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Entrar com conta Google do Gmail"
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: '#D1D5DB',
                paddingHorizontal: 16,
                marginBottom: 18,
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 10 }}>🌐</Text>
              <Text
                style={{
                  fontWeight: '700',
                  color: '#1F2937',
                  fontSize: 14 * fontScale,
                }}
              >
                Entrar com Google (Gmail)
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 11 * fontScale,
                  marginHorizontal: 10,
                  fontWeight: '500',
                }}
              >
                ou informe seu e-mail
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            </View>

            <AppInput
              rotulo="E-mail Institucional ou Pessoal"
              placeholder="seu.email@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <AppInput
              rotulo="Senha de Acesso"
              placeholder="Digite sua senha..."
              secureTextEntry={true}
              value={senha}
              onChangeText={setSenha}
            />

            <View style={{ marginTop: 6 }}>
              {carregando ? (
                <View style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : (
                <AppButton
                  title="Entrar com E-mail"
                  variant="primary"
                  onPress={autenticarPorCredenciais}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}