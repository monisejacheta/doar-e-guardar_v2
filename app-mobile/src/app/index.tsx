// src/app/index.tsx
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/commom/AppButton';

export default function HomeScreen() {
  const { theme, tokens, fontScale, mode, setMode } = useAppTheme();

  const handleToggleTheme = () => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('high-contrast');
    else setMode('light');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.primary,
              fontSize: tokens.typography.fontSize.xxl * fontScale,
            },
          ]}
        >
          Doar&Guardar 2.0
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.subtext,
              fontSize: tokens.typography.fontSize.md * fontScale,
              marginBottom: tokens.spacing.xl,
            },
          ]}
        >
          Modo visual ativo: {mode.toUpperCase()}
        </Text>

        <View style={styles.actions}>
          {/* Botão Primário: Alternar Tema */}
          <AppButton
            title="Alternar Tema (Claro / Escuro / Contraste)"
            variant="primary"
            onPress={handleToggleTheme}
            accessibilityHint="Alterna entre temas para conformidade com acessibilidade visual"
          />

          <View style={{ height: tokens.spacing.md }} />

          {/* Botão Secundário: Verde Doar (#10B981) */}
          <AppButton
            title="Registrar Entrada (Verde Doar)"
            variant="secondary"
            onPress={() => alert('Botão de ação do estoque acionado!')}
            accessibilityHint="Registrar nova entrada no estoque"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});