// src/app/accessibility-voice-nav.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAccessibilityVoiceNav } from '../styles/accessibility-voice-nav.styles';

export default function AccessibilityVoiceNavScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAccessibilityVoiceNav.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAccessibilityVoiceNav.rolagem}>
        <View style={estilosAccessibilityVoiceNav.cabecalho}>
          <Text style={[estilosAccessibilityVoiceNav.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.3.2 - Navegação por Voz
          </Text>
          <Text style={[estilosAccessibilityVoiceNav.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Habilitação de comandos verbais para navegação e preenchimento.
          </Text>
        </View>

        <View style={[estilosAccessibilityVoiceNav.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAccessibilityVoiceNav.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAccessibilityVoiceNav.areaAcao}>
            <AppButton
              title="Voltar"
              variant="primary"
              onPress={() => roteador.back()}
              accessibilityHint="Retorna para a tela anterior"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
