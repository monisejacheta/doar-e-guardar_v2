import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent } from '../../test-utils';
import AccessibilityScreen from '../../../app/accessibility';
import { mockRouter } from '../../setup';

describe('Página: Acessibilidade Principal (src/app/accessibility.tsx)', () => {
  it('deve renderizar controles de escala de fonte, modos visuais e switches de voz', async () => {
    const { getByText } = await renderWithTheme(<AccessibilityScreen />);

    expect(getByText('Acessibilidade e Leitura')).toBeTruthy();
    expect(getByText('1. Tamanho da Letra')).toBeTruthy();
    expect(getByText('2. Contraste e Cores da Tela')).toBeTruthy();
    expect(getByText('3. Assistência de Leitura e Voz')).toBeTruthy();

    await fireEvent.press(getByText('Grande (125%)'));
    await fireEvent.press(getByText('Alto Contraste (Baixa Visão - WCAG AAA)'));
    await fireEvent.press(getByText('Modo Escuro (Redução de Cansaço Visual)'));
    await fireEvent.press(getByText('Voltar'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
