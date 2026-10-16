// src/app/diagnostic-config.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnosticConfig } from '../styles/diagnostic-config.styles';

export default function DiagnosticConfigScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosDiagnosticConfig.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDiagnosticConfig.rolagem}>
        <View style={estilosDiagnosticConfig.cabecalho}>
          <Text style={[estilosDiagnosticConfig.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 9.4 - Configuração de Integrações
          </Text>
          <Text style={[estilosDiagnosticConfig.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Ajuste de chaves de integração e tolerância a falhas.
          </Text>
        </View>

        <View style={[estilosDiagnosticConfig.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosDiagnosticConfig.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosDiagnosticConfig.areaAcao}>
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
