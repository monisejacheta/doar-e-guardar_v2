import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, renderWithTheme } from '../test-utils';
import { mockRouter } from '../setup';
import AccessibilityScreen from '../../app/accessibility';
import AccessibilityDarkModeScreen from '../../app/accessibility-dark-mode';
import AccessibilityFontSizeScreen from '../../app/accessibility-font-size';
import AccessibilityHighContrastScreen from '../../app/accessibility-high-contrast';
import AccessibilityScreenReaderScreen from '../../app/accessibility-screen-reader';
import AccessibilityVoiceNavScreen from '../../app/accessibility-voice-nav';

describe('Telas de Acessibilidade (src/app/accessibility*.tsx)', () => {
  it('deve alterar escala de fonte, temas visuais, leitor de tela e salvar preferências', async () => {
    const { getByLabelText, getByText } = await renderWithTheme(<AccessibilityScreen />);

    expect(getByText('Acessibilidade e Leitura')).toBeTruthy();

    await fireEvent.press(getByLabelText('Tamanho da fonte Grande (125%)'));
    await fireEvent.press(getByLabelText('Tamanho da fonte Extra (150%)'));
    await fireEvent.press(getByLabelText('Ativar Alto Contraste (Letras Mais Fortes)'));
    await fireEvent.press(getByLabelText('Ativar Modo Escuro (Descanso para os Olhos)'));

    await fireEvent.press(getByLabelText('Ativar descrições detalhadas para leitor de tela'));
    await fireEvent.press(getByLabelText('Ativar navegação e ditado por comando de voz'));

    await fireEvent.press(getByText('Salvar e Voltar'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Acessibilidade Atualizada',
      expect.any(String),
      expect.any(Array)
    );

    await fireEvent.press(getByLabelText('Voltar para a tela anterior'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('deve renderizar todas as sub-rotas dedicadas de acessibilidade', async () => {
    const telas = [
      <AccessibilityDarkModeScreen key="1" />,
      <AccessibilityFontSizeScreen key="2" />,
      <AccessibilityHighContrastScreen key="3" />,
      <AccessibilityScreenReaderScreen key="4" />,
      <AccessibilityVoiceNavScreen key="5" />,
    ];

    for (const tela of telas) {
      const { getByText } = await renderWithTheme(tela);
      expect(getByText('Acessibilidade e Leitura')).toBeTruthy();
    }
  });
});
