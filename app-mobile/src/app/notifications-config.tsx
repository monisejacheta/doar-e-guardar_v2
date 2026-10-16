// src/app/notifications-config.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosNotificationsConfig } from '../styles/notifications-config.styles';

export default function NotificationsConfigScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosNotificationsConfig.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosNotificationsConfig.rolagem}>
        <View style={estilosNotificationsConfig.cabecalho}>
          <Text style={[estilosNotificationsConfig.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.2.2 - Configurar Notificações
          </Text>
          <Text style={[estilosNotificationsConfig.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Filtro de avisos de estoque mínimo, validade e dicas da Dora.
          </Text>
        </View>

        <View style={[estilosNotificationsConfig.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosNotificationsConfig.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosNotificationsConfig.areaAcao}>
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
