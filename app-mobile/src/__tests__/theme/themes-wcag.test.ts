import { darkTheme, highContrastTheme, lightTheme } from '../../theme/themes';

function luminanciaRelativa(hex: string): number {
  const limpo = hex.replace('#', '');
  const r = parseInt(limpo.substring(0, 2), 16) / 255;
  const g = parseInt(limpo.substring(2, 4), 16) / 255;
  const b = parseInt(limpo.substring(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function razaoContraste(hexA: string, hexB: string): number {
  const l1 = luminanciaRelativa(hexA);
  const l2 = luminanciaRelativa(hexB);
  const maior = Math.max(l1, l2);
  const menor = Math.min(l1, l2);
  return (maior + 0.05) / (menor + 0.05);
}

describe('theme/themes.ts & WCAG 2.2 AA', () => {
  it('deve garantir contraste >= 4.5:1 para texto e subtexto nos temas Claro, Escuro e Alto Contraste', () => {
    expect(razaoContraste(lightTheme.text, lightTheme.background)).toBeGreaterThanOrEqual(4.5);
    expect(razaoContraste(lightTheme.text, lightTheme.surface)).toBeGreaterThanOrEqual(4.5);
    expect(razaoContraste(lightTheme.subtext, lightTheme.background)).toBeGreaterThanOrEqual(4.5);

    expect(razaoContraste(darkTheme.text, darkTheme.background)).toBeGreaterThanOrEqual(4.5);
    expect(razaoContraste(darkTheme.text, darkTheme.surface)).toBeGreaterThanOrEqual(4.5);
    expect(razaoContraste(darkTheme.subtext, darkTheme.background)).toBeGreaterThanOrEqual(4.5);

    expect(razaoContraste(highContrastTheme.text, highContrastTheme.background)).toBeGreaterThanOrEqual(7.0);
    expect(razaoContraste(highContrastTheme.accent, highContrastTheme.background)).toBeGreaterThanOrEqual(7.0);
  });
});
