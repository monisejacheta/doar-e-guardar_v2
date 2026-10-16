// src/app/audit.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAudit } from '../styles/audit.styles';

export default function AuditScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAudit.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAudit.rolagem}>
        <View style={estilosAudit.cabecalho}>
          <Text style={[estilosAudit.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 07 - Histórico e Auditoria
          </Text>
          <Text style={[estilosAudit.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Rastreabilidade de todas as ações executadas no sistema.
          </Text>
        </View>

        <View style={[estilosAudit.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAudit.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAudit.areaAcao}>
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
