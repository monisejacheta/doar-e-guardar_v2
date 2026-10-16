// src/app/settings-users.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosSettingsUsers } from '../styles/settings-users.styles';

export default function SettingsUsersScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettingsUsers.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosSettingsUsers.rolagem}>
        <View style={estilosSettingsUsers.cabecalho}>
          <Text style={[estilosSettingsUsers.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 6.6 - Usuários do Sistema
          </Text>
          <Text style={[estilosSettingsUsers.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Controle de operadores e níveis de acesso (RBAC).
          </Text>
        </View>

        <View style={[estilosSettingsUsers.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosSettingsUsers.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosSettingsUsers.areaAcao}>
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
