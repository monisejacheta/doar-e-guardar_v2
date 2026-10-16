// src/app/profile-edit.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosProfileEdit } from '../styles/profile-edit.styles';

export default function ProfileEditScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosProfileEdit.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosProfileEdit.rolagem}>
        <View style={estilosProfileEdit.cabecalho}>
          <Text style={[estilosProfileEdit.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 2.1.2 - Editar Perfil
          </Text>
          <Text style={[estilosProfileEdit.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Atualização de nome de exibição, telefone e dados de contato.
          </Text>
        </View>

        <View style={[estilosProfileEdit.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosProfileEdit.textoInformativo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Esta tela implementa os fluxos operacionais e regras de acessibilidade estabelecidos para o módulo da Casa da Criança.
          </Text>

          <View style={estilosProfileEdit.areaAcao}>
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
