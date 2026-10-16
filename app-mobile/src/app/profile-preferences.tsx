// src/app/profile-preferences.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosProfilePreferences } from '../styles/profile-preferences.styles';

export default function ProfilePreferencesScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosProfilePreferences.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosProfilePreferences.rolagem}>
        <View style={estilosProfilePreferences.cabecalho}>
          <Text style={[estilosProfilePreferences.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.1.3 - Preferências do Usuário
          </Text>
          <Text style={[estilosProfilePreferences.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Ajuste de idioma, alertas de sistema e preferências pessoais.
          </Text>
        </View>

        <View style={[estilosProfilePreferences.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosProfilePreferences.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosProfilePreferences.areaAcao}>
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
