import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import SettingsDonorsScreen from '../../../app/settings-donors';
import { mockRouter } from '../../setup';

describe('Página: Doadores e Conformidade LGPD (src/app/settings-donors.tsx)', () => {
  it('deve exibir os doadores cadastrados e o status de proteção de dados LGPD', async () => {
    const { getByText } = await renderWithTheme(<SettingsDonorsScreen />);

    expect(getByText('6.1 Doadores e Conformidade LGPD')).toBeTruthy();
    expect(getByText('Comunidade Paroquial Local')).toBeTruthy();
    expect(getByText('Famílias Voluntárias - Sabará')).toBeTruthy();
    expect(getByText('Doação Anônima Direta (Portaria)')).toBeTruthy();

    await fireEvent.press(getByText('Voltar às Configurações'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
