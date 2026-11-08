import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import AccessibilityDarkModeScreen from '../../../app/accessibility-dark-mode';

describe('Página: Acessibilidade - Modo Escuro (src/app/accessibility-dark-mode.tsx)', () => {
  it('deve renderizar a tela de acessibilidade e permitir ativar o Modo Escuro', async () => {
    const { getByText } = await renderWithTheme(<AccessibilityDarkModeScreen />);
    expect(getByText('Modo Escuro (Redução de Cansaço Visual)')).toBeTruthy();
    await fireEvent.press(getByText('Modo Escuro (Redução de Cansaço Visual)'));
  });
});
