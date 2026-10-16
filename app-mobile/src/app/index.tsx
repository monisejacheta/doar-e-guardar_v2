// src/app/index.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppLogo } from '../components/common/AppLogo';
import { AppButton } from '../components/common/AppButton';
import { AppInput } from '../components/common/AppInput';
import { estilosLogin } from '../styles/index.styles';

export default function LoginScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale, mode, setMode } = useAppTheme();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [avisoEmail, setAvisoEmail] = useState('');
  const [avisoSenha, setAvisoSenha] = useState('');

  const alternarVisual = () => {
    if (mode === 'light') setMode('high-contrast');
    else if (mode === 'high-contrast') setMode('dark');
    else setMode('light');
  };

  const rotuloModoVisual = {
    light: 'Visual Padrão',
    dark: 'Modo Escuro (Conforto)',
    'high-contrast': 'Alto Contraste (Cores Vivas)',
  }[mode];

  // Ação direta do botão temporário de teste
  const pularDiretoParaHome = () => {
    roteador.push('/home' as Href);
  };

  const realizarLoginEmailSenha = () => {
    setAvisoEmail('');
    setAvisoSenha('');

    let temErro = false;
    if (!email.trim()) {
      setAvisoEmail('Por favor, digite seu e-mail de acesso.');
      temErro = true;
    }
    if (!senha.trim()) {
      setAvisoSenha('Por favor, informe a sua senha.');
      temErro = true;
    }

    if (temErro) return;

    roteador.push('/home' as Href);
  };

  return (
    <SafeAreaView style={[estilosLogin.container, { backgroundColor: theme.background }]}>
      {/* Botão de acessibilidade de contraste */}
      <View style={estilosLogin.barraSuperior}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Modo visual atual: ${rotuloModoVisual}. Toque para alternar.`}
          onPress={alternarVisual}
          style={[estilosLogin.botaoContraste, { borderColor: theme.border }]}
        >
          <Text style={[estilosLogin.textoContraste, { color: theme.text, fontSize: 13 * fontScale }]}>
            {rotuloModoVisual}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={estilosLogin.rolagem}
          keyboardShouldPersistTaps="handled"
        >
          {/* Símbolo Casinha de Caixas e Título */}
          <View style={estilosLogin.cabecalho}>
            <AppLogo tamanho="medio" />
            <Text
              style={[
                estilosLogin.titulo,
                { color: theme.primary, fontSize: tokens.typography.fontSize.xxl * fontScale },
              ]}
            >
              Doar & Guardar
            </Text>
            <Text
              style={[
                estilosLogin.subtitulo,
                { color: theme.subtext, fontSize: tokens.typography.fontSize.md * fontScale },
              ]}
            >
              Controle de estoque • Casa da Criança
            </Text>
          </View>

          {/* Campos de login e senha */}
          <View style={estilosLogin.formulario}>
            <AppInput
              rotulo="E-mail de acesso"
              dicaAcessibilidade="Digite seu endereço de e-mail cadastrado"
              placeholder="exemplo@casadacrianca.org.br"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(texto) => {
                setEmail(texto);
                if (avisoEmail) setAvisoEmail('');
              }}
              mensagemAviso={avisoEmail}
            />

            <AppInput
              rotulo="Senha"
              dicaAcessibilidade="Digite sua senha cadastrada"
              placeholder="Digite sua senha"
              eSenha={true}
              value={senha}
              onChangeText={(texto) => {
                setSenha(texto);
                if (avisoSenha) setAvisoSenha('');
              }}
              mensagemAviso={avisoSenha}
            />

            <TouchableOpacity
              onPress={() => Alert.alert('Recuperar Senha', 'Solicite o reset à coordenação da Casa da Criança.')}
              accessible={true}
              accessibilityRole="button"
              style={estilosLogin.linkEsqueciSenha}
            >
              <Text
                style={[
                  estilosLogin.textoEsqueciSenha,
                  { color: theme.primary, fontSize: tokens.typography.fontSize.sm * fontScale },
                ]}
              >
                Esqueceu a senha?
              </Text>
            </TouchableOpacity>

            <AppButton
              title="Entrar"
              variant="primary"
              onPress={realizarLoginEmailSenha}
              accessibilityHint="Toque duas vezes para entrar com seus dados"
            />
          </View>

          {/* Divisor */}
          <View style={estilosLogin.divisorContainer}>
            <View style={[estilosLogin.linhaDivisoria, { backgroundColor: theme.border }]} />
            <Text
              style={[
                estilosLogin.textoDivisor,
                { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
              ]}
            >
              ou
            </Text>
            <View style={[estilosLogin.linhaDivisoria, { backgroundColor: theme.border }]} />
          </View>

          {/* Botão de login oficial Google */}
          <View style={estilosLogin.areaGoogle}>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Entrar direto com a conta Google institucional"
              onPress={pularDiretoParaHome}
              style={[
                estilosLogin.botaoGoogle,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  minHeight: tokens.touchTarget.minHeight,
                  borderRadius: tokens.touchTarget.borderRadius,
                },
              ]}
            >
              <Text style={[estilosLogin.iconeGoogle, { color: theme.primary }]}>G</Text>
              <Text
                style={[
                  estilosLogin.textoGoogle,
                  { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
                ]}
              >
                Entrar com conta Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* BOTÃO TEMPORÁRIO PARA DESENVOLVIMENTO */}
          <View style={estilosLogin.areaSimulacao}>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Botão de teste para simular login direto e abrir a página inicial"
              onPress={pularDiretoParaHome}
              style={[
                estilosLogin.botaoSimulacao,
                {
                  borderColor: theme.secondary, // Verde Doar #10B981
                  minHeight: tokens.touchTarget.minHeight,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <Text
                style={[
                  estilosLogin.textoSimulacao,
                  { color: theme.secondary, fontSize: tokens.typography.fontSize.sm * fontScale },
                ]}
              >
                ⚡ Simular Login (Acessar Início)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={estilosLogin.rodapeAjuda}>
            <Text
              style={[
                estilosLogin.textoRodape,
                { color: theme.subtext, fontSize: tokens.typography.fontSize.xs * fontScale },
              ]}
            >
              Acesso exclusivo para voluntários e colaboradores da Casa da Criança.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}