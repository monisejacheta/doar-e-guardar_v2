import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import SettingsReasonsScreen from '../../../app/settings-reasons';
import { mockRouter } from '../../setup';

describe('Página: Motivos de Saída e Trava US07 (src/app/settings-reasons.tsx)', () => {
  it('deve exibir os motivos de saída homologados e sinalizar a trava de segurança PERDA', async () => {
    const { getByText } = await renderWithTheme(<SettingsReasonsScreen />);

    expect(getByText('6.7 Motivos de Saída (US07)')).toBeTruthy();
    expect(getByText('🍲 Consumo Diário na Cozinha')).toBeTruthy();
    expect(getByText('⚠️ Descarte por Vencimento (US07)')).toBeTruthy();
    expect(getByText('📦 Descarte por Avaria ou Violação (US07)')).toBeTruthy();

    await fireEvent.press(getByText('Voltar às Configurações'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
