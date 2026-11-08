import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import SettingsCampaignsScreen from '../../../app/settings-campaigns';
import { mockRouter } from '../../setup';

describe('Página: Campanhas de Doações Ativas (src/app/settings-campaigns.tsx)', () => {
  it('deve listar as campanhas homologadas pela diretoria (Regra W08)', async () => {
    const { getByText } = await renderWithTheme(<SettingsCampaignsScreen />);

    expect(getByText('6.3 Campanhas de Doações Ativas')).toBeTruthy();
    expect(getByText('Arrecadação de Leite Integral UHT e Leite em Pó')).toBeTruthy();
    expect(getByText('Campanha Cesta Básica Solidária (Arroz, Feijão e Óleo)')).toBeTruthy();

    await fireEvent.press(getByText('Voltar às Configurações'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
