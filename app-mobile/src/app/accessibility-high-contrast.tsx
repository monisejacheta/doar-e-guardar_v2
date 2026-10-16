// src/app/accessibility-high-contrast.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAccessibilityHighContrast } from '../styles/accessibility-high-contrast.styles';

export default function AccessibilityHighContrastScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAccessibilityHighContrast.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAccessibilityHighContrast.rolagem}>
        <View style={estilosAccessibilityHighContrast.cabecalho}>
          <Text style={[estilosAccessibilityHighContrast.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.3.4 - Alto Contraste
          </Text>
          <Text style={[estilosAccessibilityHighContrast.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Ativação de contraste máximo para suporte à baixa visão.
          </Text>
        </View>

        <View style={[estilosAccessibilityHighContrast.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAccessibilityHighContrast.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAccessibilityHighContrast.areaAcao}>
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
