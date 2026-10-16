// src/app/settings-storage.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosSettingsStorage } from '../styles/settings-storage.styles';

export default function SettingsStorageScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettingsStorage.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosSettingsStorage.rolagem}>
        <View style={estilosSettingsStorage.cabecalho}>
          <Text style={[estilosSettingsStorage.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 6.5 - Locais de Armazenamento
          </Text>
          <Text style={[estilosSettingsStorage.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Mapeamento de armários e geladeiras (sem ruas ou corredores).
          </Text>
        </View>

        <View style={[estilosSettingsStorage.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosSettingsStorage.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosSettingsStorage.areaAcao}>
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
