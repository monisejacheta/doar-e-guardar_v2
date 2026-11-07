// src/components/common/AppIcon.tsx
import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

export type IconName =
  | 'user'
  | 'bell'
  | 'contrast'
  | 'box'
  | 'camera'
  | 'arrow-down-circle'
  | 'refresh-cw'
  | 'clipboard'
  | 'bar-chart-2'
  | 'settings'
  | 'activity'
  | 'help-circle'
  | 'search'
  | 'x'
  | 'alert-triangle'
  | 'clock'
  | 'send'
  | 'chevron-right'
  | 'log-out';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  variant?: 'primary' | 'secondary' | 'amber' | 'danger' | 'neutral' | 'text';
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 22,
  color,
  variant = 'neutral',
}) => {
  const { theme, tokens } = useAppTheme();

  // Mapeamento semântico dos ícones conforme a paleta oficial (Azul & Verde)
  const resolveColor = (): string => {
    if (color) return color;
    switch (variant) {
      case 'primary':
        return theme.primary; // Azul Guardar (#1E3A8A)
      case 'secondary':
        return theme.secondary; // Verde Doar (#10B981)
      case 'amber':
        return tokens.colors.accentAmber500; // Âmbar Alerta Dora (#F59E0B)
      case 'danger':
        return theme.danger; // Vermelho Alerta (#DC2626)
      case 'text':
        return theme.text;
      case 'neutral':
      default:
        return tokens.colors.neutral600; // Cinza Grafite (#4B5563)
    }
  };

  // Mapeamento interno para o catálogo Feather
  const featherNameMap: Record<IconName, keyof typeof Feather.glyphMap> = {
    user: 'user',
    bell: 'bell',
    contrast: 'sun',
    box: 'package',
    camera: 'camera',
    'arrow-down-circle': 'arrow-down-circle',
    'refresh-cw': 'refresh-cw',
    clipboard: 'clipboard',
    'bar-chart-2': 'bar-chart-2',
    settings: 'settings',
    activity: 'activity',
    'help-circle': 'help-circle',
    search: 'search',
    x: 'x',
    'alert-triangle': 'alert-triangle',
    clock: 'clock',
    send: 'send',
    'chevron-right': 'chevron-right',
    'log-out': 'log-out',
  };

  return (
    <Feather
      name={featherNameMap[name] || 'circle'}
      size={size}
      color={resolveColor()}
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
    />
  );
};