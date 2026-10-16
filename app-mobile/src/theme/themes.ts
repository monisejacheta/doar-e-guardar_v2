// src/theme/themes.ts
import { tokens } from './tokens';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  danger: string;
  background: string;
  surface: string;
  text: string;
  subtext: string;
  border: string;
  focusIndicator: string;
}

export const lightTheme: ThemeColors = {
  primary: tokens.colors.brandBlue900,
  secondary: tokens.colors.brandGreen500,
  accent: tokens.colors.accentAmber500,
  danger: tokens.colors.stateError600,
  background: '#FFFFFF',
  surface: tokens.colors.neutral100,
  text: tokens.colors.neutral900,
  subtext: tokens.colors.neutral600,
  border: '#E5E7EB',
  focusIndicator: tokens.colors.brandBlue900,
};

export const darkTheme: ThemeColors = {
  primary: '#3B82F6',
  secondary: tokens.colors.brandGreen500,
  accent: tokens.colors.accentAmber500,
  danger: '#EF4444',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  border: '#334155',
  focusIndicator: '#60A5FA',
};

export const highContrastTheme: ThemeColors = {
  primary: '#0000FF',
  secondary: '#008000',
  accent: '#FFFF00',
  danger: '#FF0000',
  background: '#000000',
  surface: '#121212',
  text: '#FFFFFF',
  subtext: '#FFFF00',
  border: '#FFFFFF',
  focusIndicator: '#FFFF00',
};