// src/components/common/ActionCard.tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcon, IconName } from './AppIcon';

interface ActionCardProps {
  titulo: string;
  descricao: string;
  iconName: IconName;
  aoTocar: () => void;
  destaque?: boolean;
  corDestaque?: string;
  dicaAcessibilidade?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  titulo,
  descricao,
  iconName,
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
          minHeight: tokens.touchTarget.minHeight, // Mínimo de 48px conforme WCAG AAA
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
        <AppIcon
          name={iconName}
          size={24}
          color={corDestaque || (destaque ? theme.secondary : theme.primary)}
        />
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

      <AppIcon name="chevron-right" size={18} variant="neutral" />
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
  areaTexto: {
    flex: 1,
    paddingRight: 8,
  },
  titulo: {
    fontWeight: '700',
    marginBottom: 2,
  },
  descricao: {
    lineHeight: 16,
  },
});