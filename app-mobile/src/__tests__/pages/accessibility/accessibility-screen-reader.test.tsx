import React from 'react';
import { renderWithTheme } from '../../test-utils';
import AccessibilityScreenReaderScreen from '../../../app/accessibility-screen-reader';

describe('Página: Acessibilidade - Leitor de Tela (src/app/accessibility-screen-reader.tsx)', () => {
  it('deve renderizar a seção de descrições para leitor de tela (TalkBack / VoiceOver)', async () => {
    const { getByText } = await renderWithTheme(<AccessibilityScreenReaderScreen />);
    expect(getByText('Descrições para Leitor de Tela')).toBeTruthy();
  });
});
