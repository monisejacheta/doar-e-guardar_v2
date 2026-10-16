// src/app/diagnostic-aws.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnosticAws } from '../styles/diagnostic-aws.styles';

export default function DiagnosticAwsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosDiagnosticAws.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDiagnosticAws.rolagem}>
        <View style={estilosDiagnosticAws.cabecalho}>
          <Text style={[estilosDiagnosticAws.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 9.1 - Serviços AWS
          </Text>
          <Text style={[estilosDiagnosticAws.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Monitoramento de latência e execução das funções serverless.
          </Text>
        </View>

        <View style={[estilosDiagnosticAws.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosDiagnosticAws.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosDiagnosticAws.areaAcao}>
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
