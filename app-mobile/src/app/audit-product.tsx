// src/app/audit-product.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosAuditProduct } from '../styles/audit-product.styles';

export default function AuditProductScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosAuditProduct.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAuditProduct.rolagem}>
        <View style={estilosAuditProduct.cabecalho}>
          <Text style={[estilosAuditProduct.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 7.2 - Auditoria por Produto
          </Text>
          <Text style={[estilosAuditProduct.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Rastro de entradas e baixas associadas a um alimento.
          </Text>
        </View>

        <View style={[estilosAuditProduct.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosAuditProduct.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosAuditProduct.areaAcao}>
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
