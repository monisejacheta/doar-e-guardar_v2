import React from 'react';
import { renderWithTheme } from '../../test-utils';
import AccessibilityVoiceNavScreen from '../../../app/accessibility-voice-nav';

describe('Página: Acessibilidade - Navegação por Voz (src/app/accessibility-voice-nav.tsx)', () => {
  it('deve renderizar a seção de assistência de leitura e navegação por voz', async () => {
    const { getByText } = await renderWithTheme(<AccessibilityVoiceNavScreen />);
    expect(getByText('3. Assistência de Leitura e Voz')).toBeTruthy();
  });
});
