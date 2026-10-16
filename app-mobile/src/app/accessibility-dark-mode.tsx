// src/app/accessibility-dark-mode.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAccessibilityDarkMode } from '../styles/accessibility-dark-mode.styles';

export default function AccessibilityDarkModeScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAccessibilityDarkMode.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAccessibilityDarkMode.rolagem}>
        <View style={estilosAccessibilityDarkMode.cabecalho}>
          <Text style={[estilosAccessibilityDarkMode.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.3.5 - Modo Escuro
          </Text>
          <Text style={[estilosAccessibilityDarkMode.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Ajuste de tons escuros para redução de fadiga visual.
          </Text>
        </View>

        <View style={[estilosAccessibilityDarkMode.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAccessibilityDarkMode.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAccessibilityDarkMode.areaAcao}>
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
