import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import SettingsInstitutionsScreen from '../../../app/settings-institutions';
import { mockRouter } from '../../setup';

describe('Página: Instituições Parceiras (src/app/settings-institutions.tsx)', () => {
  it('deve listar as instituições parceiras homologadas pela Casa da Criança', async () => {
    const { getByText } = await renderWithTheme(<SettingsInstitutionsScreen />);

    expect(getByText('6.2 Instituições Parceiras')).toBeTruthy();
    expect(getByText('Banco de Alimentos Municipal')).toBeTruthy();
    expect(getByText('Rede de Supermercados Parceiros')).toBeTruthy();
    expect(getByText('CONAB / Programa de Aquisição de Alimentos')).toBeTruthy();

    await fireEvent.press(getByText('Voltar às Configurações'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
