// src/app/accessibility-screen-reader.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAccessibilityScreenReader } from '../styles/accessibility-screen-reader.styles';

export default function AccessibilityScreenReaderScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAccessibilityScreenReader.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAccessibilityScreenReader.rolagem}>
        <View style={estilosAccessibilityScreenReader.cabecalho}>
          <Text style={[estilosAccessibilityScreenReader.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.3.1 - Leitor de Tela
          </Text>
          <Text style={[estilosAccessibilityScreenReader.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Ativação e ajuste de textos alternativos e sintetizador de voz.
          </Text>
        </View>

        <View style={[estilosAccessibilityScreenReader.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAccessibilityScreenReader.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAccessibilityScreenReader.areaAcao}>
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
