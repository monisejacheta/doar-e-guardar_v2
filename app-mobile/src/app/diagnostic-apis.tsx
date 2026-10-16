// src/app/diagnostic-apis.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnosticApis } from '../styles/diagnostic-apis.styles';

export default function DiagnosticApisScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosDiagnosticApis.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDiagnosticApis.rolagem}>
        <View style={estilosDiagnosticApis.cabecalho}>
          <Text style={[estilosDiagnosticApis.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 9.3 - APIs e Conectividade
          </Text>
          <Text style={[estilosDiagnosticApis.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Status da conexão à internet e das 3 APIs em cascata.
          </Text>
        </View>

        <View style={[estilosDiagnosticApis.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosDiagnosticApis.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosDiagnosticApis.areaAcao}>
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
