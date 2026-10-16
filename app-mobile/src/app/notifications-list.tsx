// src/app/notifications-list.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosNotificationsList } from '../styles/notifications-list.styles';

export default function NotificationsListScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosNotificationsList.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosNotificationsList.rolagem}>
        <View style={estilosNotificationsList.cabecalho}>
          <Text style={[estilosNotificationsList.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.2.1 - Lista de Notificações
          </Text>
          <Text style={[estilosNotificationsList.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Detalhamento cronológico e gerenciamento de avisos recebidos.
          </Text>
        </View>

        <View style={[estilosNotificationsList.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosNotificationsList.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosNotificationsList.areaAcao}>
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
