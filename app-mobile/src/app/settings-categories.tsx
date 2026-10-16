// src/app/settings-categories.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosSettingsCategories } from '../styles/settings-categories.styles';

export default function SettingsCategoriesScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettingsCategories.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosSettingsCategories.rolagem}>
        <View style={estilosSettingsCategories.cabecalho}>
          <Text style={[estilosSettingsCategories.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 6.4 - Categorias de Alimentos
          </Text>
          <Text style={[estilosSettingsCategories.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Estruturação de categorias, subcategorias e descrições.
          </Text>
        </View>

        <View style={[estilosSettingsCategories.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosSettingsCategories.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosSettingsCategories.areaAcao}>
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
