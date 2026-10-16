// src/app/diagnostic-database.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnosticDatabase } from '../styles/diagnostic-database.styles';

export default function DiagnosticDatabaseScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosDiagnosticDatabase.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDiagnosticDatabase.rolagem}>
        <View style={estilosDiagnosticDatabase.cabecalho}>
          <Text style={[estilosDiagnosticDatabase.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 9.2 - Banco de Dados
          </Text>
          <Text style={[estilosDiagnosticDatabase.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Integridade da conexão com banco relacional e NoSQL.
          </Text>
        </View>

        <View style={[estilosDiagnosticDatabase.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosDiagnosticDatabase.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosDiagnosticDatabase.areaAcao}>
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
