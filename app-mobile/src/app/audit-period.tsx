// src/app/audit-period.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAuditPeriod } from '../styles/audit-period.styles';

export default function AuditPeriodScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAuditPeriod.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAuditPeriod.rolagem}>
        <View style={estilosAuditPeriod.cabecalho}>
          <Text style={[estilosAuditPeriod.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 7.3 - Auditoria por Período
          </Text>
          <Text style={[estilosAuditPeriod.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Filtro cronológico de operações para conferência periódica.
          </Text>
        </View>

        <View style={[estilosAuditPeriod.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAuditPeriod.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAuditPeriod.areaAcao}>
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
