// src/components/common/ActionCard.tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface ActionCardProps {
  titulo: string;
  descricao: string;
  icone: string;
  aoTocar: () => void;
  destaque?: boolean;
  corDestaque?: string;
  dicaAcessibilidade?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  titulo,
  descricao,
  icone,
  aoTocar,
  destaque = false,
  corDestaque,
  dicaAcessibilidade,
}) => {
  const { theme, tokens, fontScale } = useAppTheme();

  const bordaAtiva = corDestaque || (destaque ? theme.secondary : theme.border);

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${descricao}`}
      accessibilityHint={dicaAcessibilidade || 'Toque duas vezes para abrir esta opção'}
      activeOpacity={0.8}
      onPress={aoTocar}
      style={[
        estilos.cartao,
        {
          backgroundColor: theme.surface,
          borderColor: bordaAtiva,
          borderRadius: tokens.touchTarget.borderRadius,
          minHeight: 80,
        },
      ]}
    >
      <View
        style={[
          estilos.areaIcone,
          {
            backgroundColor: destaque ? `${theme.secondary}15` : theme.background,
            borderColor: bordaAtiva,
          },
        ]}
      >
        <Text style={[estilos.textoIcone, { color: corDestaque || theme.primary }]}>
          {icone}
        </Text>
      </View>

      <View style={estilos.areaTexto}>
        <Text
          style={[
            estilos.titulo,
            {
              color: theme.text,
              fontSize: tokens.typography.fontSize.md * fontScale,
            },
          ]}
        >
          {titulo}
        </Text>
        <Text
          style={[
            estilos.descricao,
            {
              color: theme.subtext,
              fontSize: tokens.typography.fontSize.xs * fontScale,
            },
          ]}
        >
          {descricao}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  cartao: {
    width: '100%',
    padding: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  areaIcone: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textoIcone: {
    fontSize: 22,
  },
  areaTexto: {
    flex: 1,
  },
  titulo: {
    fontWeight: '700',
    marginBottom: 3,
  },
  descricao: {
    lineHeight: 16,
  },
});