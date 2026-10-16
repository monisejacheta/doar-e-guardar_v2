// src/app/settings-reasons.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosSettingsReasons } from '../styles/settings-reasons.styles';

export default function SettingsReasonsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettingsReasons.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosSettingsReasons.rolagem}>
        <View style={estilosSettingsReasons.cabecalho}>
          <Text style={[estilosSettingsReasons.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 6.7 - Motivos de Saída
          </Text>
          <Text style={[estilosSettingsReasons.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Configuração dos motivos padrão para baixas de estoque.
          </Text>
        </View>

        <View style={[estilosSettingsReasons.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosSettingsReasons.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosSettingsReasons.areaAcao}>
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
