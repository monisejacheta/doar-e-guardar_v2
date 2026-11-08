import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import AccessibilityFontSizeScreen from '../../../app/accessibility-font-size';

describe('Página: Acessibilidade - Tamanho da Fonte (src/app/accessibility-font-size.tsx)', () => {
  it('deve renderizar a tela de acessibilidade e permitir alterar a escala da letra', async () => {
    const { getByText } = await renderWithTheme(<AccessibilityFontSizeScreen />);
    expect(getByText('1. Tamanho da Letra')).toBeTruthy();
    await fireEvent.press(getByText('Extra (150%)'));
  });
});
