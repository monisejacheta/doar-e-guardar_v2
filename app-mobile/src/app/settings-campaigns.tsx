// src/app/settings-campaigns.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosSettingsCampaigns } from '../styles/settings-campaigns.styles';

export default function SettingsCampaignsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettingsCampaigns.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosSettingsCampaigns.rolagem}>
        <View style={estilosSettingsCampaigns.cabecalho}>
          <Text style={[estilosSettingsCampaigns.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 6.3 - Campanhas de Doações Ativas
          </Text>
          <Text style={[estilosSettingsCampaigns.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Consulta de iniciativas de arrecadação propostas por doadores.
          </Text>
        </View>

        <View style={[estilosSettingsCampaigns.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosSettingsCampaigns.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosSettingsCampaigns.areaAcao}>
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
