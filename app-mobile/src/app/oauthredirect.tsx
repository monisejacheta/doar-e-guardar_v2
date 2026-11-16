import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authService, extrairParametrosOAuthDeUrl } from '../services/authService';
import { useAppTheme } from '../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectScreen() {
  const router = useRouter();
  const { theme, fontScale } = useAppTheme();
  const urlAtual = Linking.useURL();

  useEffect(() => {
    let ativo = true;

    const processarRetorno = async () => {
      try {
        const urlInicial = urlAtual || (await Linking.getInitialURL()) || '';
        const { idToken, accessToken } = extrairParametrosOAuthDeUrl(urlInicial);

        if (idToken || accessToken) {
          const usuario = await authService.autenticarComTokensGoogle(idToken, accessToken);
          if (ativo && usuario) {
            router.replace('/home');
            return;
          }
        }

        const sessaoExistente = await authService.obterSessaoLocal();
        if (ativo) {
          if (sessaoExistente) {
            router.replace('/home');
          } else {
            router.replace('/');
          }
        }
      } catch {
        if (ativo) {
          router.replace('/');
        }
      }
    };

    processarRetorno();

    return () => {
      ativo = false;
    };
  }, [urlAtual, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={require('../../assets/images/wallpaperLogin.jpg')}
          style={{ opacity: 0.45, width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={[styles.appName, { color: theme.primary, fontSize: 30 * fontScale }]}>
            Doar &amp; Guardar
          </Text>
          <Text style={[styles.subtitle, { color: theme.subtext, fontSize: 13 * fontScale }]}>
            Gestão de estoque e doações da Casa da Criança
          </Text>
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
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.tituloStatus, { color: theme.text, fontSize: 16 * fontScale }]}>
            Conectando sua conta...
          </Text>
          <Text style={[styles.textoStatus, { color: theme.subtext, fontSize: 13 * fontScale }]}>
            Validando seu acesso com o Google no sistema da Casa da Criança.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.subtext, fontSize: 11.5 * fontScale }]}>
            Casa da Criança • Gestão Solidária e Transparente
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 420,
    width: '100%',
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
  subtitle: {
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tituloStatus: {
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  textoStatus: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
});
