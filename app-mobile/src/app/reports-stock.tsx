// src/app/reports-stock.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosReportsStock } from '../styles/reports-stock.styles';

export default function ReportsStockScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosReportsStock.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsStock.rolagem}>
        <View style={estilosReportsStock.cabecalho}>
          <Text style={[estilosReportsStock.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 4.1 - Relatório de Estoque Atual
          </Text>
          <Text style={[estilosReportsStock.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Exportação em PDF do inventário ativo com gráficos de saldo.
          </Text>
        </View>

        <View style={[estilosReportsStock.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosReportsStock.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosReportsStock.areaAcao}>
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
