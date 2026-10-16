// src/theme/tokens.ts

export const tokens = {
  colors: {
    // Identidade Visual Oficial
    brandBlue900: '#1E3A8A', // Azul Guardar (Primária / Header / Auditoria)[cite: 3]
    brandGreen500: '#10B981', // Verde Doar (Secundária / Entradas / Campanhas)[cite: 3]
    accentAmber500: '#F59E0B', // Âmbar Alerta (Dora / Vencimento FEFO < 7 dias)[cite: 3]
    stateError600: '#DC2626',  // Vermelho Alerta (Ações destrutivas / Confirmação PERDA)

    // Neutros Base
    neutral900: '#111827',     // Texto Principal (16.1:1 em fundo claro)[cite: 3]
    neutral600: '#4B5563',     // Cinza Grafite (Ícones, subtextos, códigos)[cite: 3]
    neutral100: '#F3F4F6',     // Superfície Neutra (Inputs, cartões, fundos)[cite: 3]
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
  },
  touchTarget: {
    minHeight: 48, // WCAG 2.1 AAA: touch target mínimo de 48px a 52px[cite: 3]
    borderRadius: 12, // rounded-xl padrão do design system[cite: 3]
  },
} as const;