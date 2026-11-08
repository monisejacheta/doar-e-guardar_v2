import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import AccessibilityHighContrastScreen from '../../../app/accessibility-high-contrast';

describe('Página: Acessibilidade - Alto Contraste (src/app/accessibility-high-contrast.tsx)', () => {
  it('deve renderizar a tela de acessibilidade e permitir ativar Alto Contraste WCAG AAA', async () => {
    const { getByText } = await renderWithTheme(<AccessibilityHighContrastScreen />);
    expect(getByText('Alto Contraste (Baixa Visão - WCAG AAA)')).toBeTruthy();
    await fireEvent.press(getByText('Alto Contraste (Baixa Visão - WCAG AAA)'));
  });
});
