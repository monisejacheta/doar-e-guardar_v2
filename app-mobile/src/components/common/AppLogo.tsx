// src/components/common/AppLogo.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface AppLogoProps {
  tamanho?: 'pequeno' | 'medio' | 'grande';
}

export const AppLogo: React.FC<AppLogoProps> = ({ tamanho = 'medio' }) => {
  const { theme } = useAppTheme();

  const dimensoes = {
    pequeno: { telhado: 32, caixa: 16, espaco: 4 },
    medio: { telhado: 42, caixa: 22, espaco: 6 },
    grande: { telhado: 56, caixa: 28, espaco: 8 },
  }[tamanho];

  return (
    <View
      style={estilos.areaLogo}
      accessible={true}
      accessibilityLabel="Símbolo da Casa da Criança: uma casinha acolhedora formada por caixas de mantimentos"
    >
      <Text style={[estilos.telhado, { color: theme.primary, fontSize: dimensoes.telhado, lineHeight: dimensoes.telhado }]}>
        ▲
      </Text>
      <View style={[estilos.linhaCaixas, { gap: dimensoes.espaco, marginTop: -dimensoes.espaco }]}>
        <View style={[estilos.caixa, { backgroundColor: theme.primary, width: dimensoes.caixa, height: dimensoes.caixa }]} />
        <View style={[estilos.caixa, { backgroundColor: theme.secondary, width: dimensoes.caixa, height: dimensoes.caixa }]} />
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  areaLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  telhado: {
    textAlign: 'center',
  },
  linhaCaixas: {
    flexDirection: 'row',
  },
  caixa: {
    borderRadius: 4,
  },
});