// src/app/generic-subscreen.tsx
import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';

export default function GenericSubscreen() {
  const { title, subtitle } = useLocalSearchParams();
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 8 }}>
          {title || 'Área do Aplicativo'}
        </Text>
        <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginBottom: 20, lineHeight: 20 }}>
          {subtitle || 'Cuidado simples e organizado para a despensa da Casa da Criança.'}
        </Text>

        <View
          style={{
            borderWidth: 1.5,
            borderRadius: 14,
            padding: 20,
            backgroundColor: theme.surface,
            borderColor: theme.border,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 14 * fontScale, lineHeight: 22 }}>
            Esta tela ajuda você a consultar, cadastrar e manter as informações da despensa sempre atualizadas de forma simples e rápida.
          </Text>
        </View>

        <AppButton
          title="Voltar"
          variant="primary"
          onPress={() => roteador.back()}
          accessibilityHint="Retorna à tela anterior"
        />
      </ScrollView>
    </SafeAreaView>
  );
}