// src/app/accessibility-font-size.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAccessibilityFontSize } from '../styles/accessibility-font-size.styles';

export default function AccessibilityFontSizeScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAccessibilityFontSize.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAccessibilityFontSize.rolagem}>
        <View style={estilosAccessibilityFontSize.cabecalho}>
          <Text style={[estilosAccessibilityFontSize.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.3.3 - Tamanho da Fonte
          </Text>
          <Text style={[estilosAccessibilityFontSize.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Redimensionamento dinâmico tipográfico sem corte de layout.
          </Text>
        </View>

        <View style={[estilosAccessibilityFontSize.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAccessibilityFontSize.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAccessibilityFontSize.areaAcao}>
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
