// src/app/stock-details.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosStockDetails } from '../styles/stock-details.styles';

export default function StockDetailsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosStockDetails.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockDetails.rolagem}>
        <View style={estilosStockDetails.cabecalho}>
          <Text style={[estilosStockDetails.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 3.4 - Consulta Detalhada de Estoque
          </Text>
          <Text style={[estilosStockDetails.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Visão aprofundada de lotes, prioridade FEFO e saldos ativos.
          </Text>
        </View>

        <View style={[estilosStockDetails.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosStockDetails.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosStockDetails.areaAcao}>
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
