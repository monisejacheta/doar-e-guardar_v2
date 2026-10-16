// src/app/diagnostic.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnostic } from '../styles/diagnostic.styles';

export default function DiagnosticScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosDiagnostic.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDiagnostic.rolagem}>
        <View style={estilosDiagnostic.cabecalho}>
          <Text style={[estilosDiagnostic.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 09 - Verificar Disponibilidade
          </Text>
          <Text style={[estilosDiagnostic.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Checagem de saúde da nuvem AWS, bancos SQL/NoSQL e APIs.
          </Text>
        </View>

        <View style={[estilosDiagnostic.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosDiagnostic.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosDiagnostic.areaAcao}>
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
