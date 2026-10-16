// src/app/reports-movements.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosReportsMovements } from '../styles/reports-movements.styles';

export default function ReportsMovementsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosReportsMovements.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReportsMovements.rolagem}>
        <View style={estilosReportsMovements.cabecalho}>
          <Text style={[estilosReportsMovements.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 4.2 - Relatório de Movimentações
          </Text>
          <Text style={[estilosReportsMovements.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Histórico de entradas, saídas e transferências por período.
          </Text>
        </View>

        <View style={[estilosReportsMovements.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosReportsMovements.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosReportsMovements.areaAcao}>
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
