// src/app/settings-institutions.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosSettingsInstitutions } from '../styles/settings-institutions.styles';

export default function SettingsInstitutionsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettingsInstitutions.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosSettingsInstitutions.rolagem}>
        <View style={estilosSettingsInstitutions.cabecalho}>
          <Text style={[estilosSettingsInstitutions.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 6.2 - Gerenciamento de Instituições
          </Text>
          <Text style={[estilosSettingsInstitutions.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Cadastro e vínculo de instituições parceiras com representantes.
          </Text>
        </View>

        <View style={[estilosSettingsInstitutions.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosSettingsInstitutions.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosSettingsInstitutions.areaAcao}>
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
