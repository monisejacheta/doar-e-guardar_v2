import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import SettingsScreen from '../../../app/settings';
import { mockRouter } from '../../setup';

describe('Página: Configurações e Cadastros Principais (src/app/settings.tsx)', () => {
  it('deve exibir todas as opções de configuração e navegar para cada subtela correspondente', async () => {
    const { getByText } = await renderWithTheme(<SettingsScreen />);

    expect(getByText('Configurações e Cadastros')).toBeTruthy();

    await fireEvent.press(getByText('6.5 Locais de Armazenamento (Prateleiras AWS)'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-storage');

    await fireEvent.press(getByText('6.4 Categorias de Alimentos'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-categories');

    await fireEvent.press(getByText('6.7 Motivos de Saída e Trava US07'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-reasons');

    await fireEvent.press(getByText('6.1 Doadores (Pessoa Física)'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-donors');

    await fireEvent.press(getByText('6.2 Instituições Parceiras'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-institutions');

    await fireEvent.press(getByText('6.3 Campanhas de Doações Ativas'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-campaigns');

    await fireEvent.press(getByText('6.6 Usuários e Permissões'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-users');

    await fireEvent.press(getByText('6.8 Backup e Sincronização AWS'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-sync');
  });
});
