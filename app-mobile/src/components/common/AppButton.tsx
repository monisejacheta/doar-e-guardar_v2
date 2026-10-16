// src/components/common/AppButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityHint,
}) => {
  const { theme, tokens, fontScale } = useAppTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.subtext;
    switch (variant) {
      case 'secondary':
        return theme.secondary; // Verde Doar #10B981[cite: 3]
      case 'danger':
        return theme.danger;    // Vermelho Alerta #DC2626[cite: 3]
      default:
        return theme.primary;   // Azul Guardar #1E3A8A[cite: 3]
    }
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          minHeight: tokens.touchTarget.minHeight, // 48px garantido[cite: 3]
          borderRadius: tokens.touchTarget.borderRadius, // 12px[cite: 3]
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tokens.colors.white} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize: tokens.typography.fontSize.md * fontScale,
              color: tokens.colors.white,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '700',
  },
});