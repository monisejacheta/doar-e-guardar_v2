// src/app/reports-losses.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosReportsLosses } from '../styles/reports-losses.styles';

export default function ReportsLossesScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosReportsLosses.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsLosses.rolagem}>
        <View style={estilosReportsLosses.cabecalho}>
          <Text style={[estilosReportsLosses.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 4.3 - Relatório de Perdas e Descartes
          </Text>
          <Text style={[estilosReportsLosses.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Auditoria de descarte justificado com consolidação quantitativa.
          </Text>
        </View>

        <View style={[estilosReportsLosses.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosReportsLosses.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosReportsLosses.areaAcao}>
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
