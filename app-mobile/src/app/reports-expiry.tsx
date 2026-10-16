// src/app/reports-expiry.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosReportsExpiry } from '../styles/reports-expiry.styles';

export default function ReportsExpiryScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosReportsExpiry.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsExpiry.rolagem}>
        <View style={estilosReportsExpiry.cabecalho}>
          <Text style={[estilosReportsExpiry.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 4.4 - Relatório de Validades
          </Text>
          <Text style={[estilosReportsExpiry.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Mapeamento de lotes ordenados por data de vencimento (FEFO).
          </Text>
        </View>

        <View style={[estilosReportsExpiry.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosReportsExpiry.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosReportsExpiry.areaAcao}>
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
