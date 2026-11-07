// src/components/common/AppButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityHint,
  style,
}) => {
  const { theme, tokens, fontScale } = useAppTheme();

  const isOutline = variant === 'outline';

  const getBackgroundColor = () => {
    if (disabled) return theme.subtext;
    if (isOutline) return 'transparent';
    switch (variant) {
      case 'secondary':
        return theme.secondary;
      case 'danger':
        return theme.danger;
      default:
        return theme.primary;
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
          minHeight: tokens.touchTarget.minHeight,
          borderRadius: tokens.touchTarget.borderRadius,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? theme.primary : 'transparent',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.primary : tokens.colors.white} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize: tokens.typography.fontSize.md * fontScale,
              color: isOutline ? theme.primary : tokens.colors.white,
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
