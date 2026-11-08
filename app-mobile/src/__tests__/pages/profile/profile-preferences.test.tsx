import React from 'react';
import { renderWithTheme } from '../../test-utils';
import ProfilePreferencesScreen from '../../../app/profile-preferences';

describe('Página: Preferências de Perfil (src/app/profile-preferences.tsx)', () => {
  it('deve renderizar a tela de preferências visuais e acessibilidade do usuário', async () => {
    const { getByText } = await renderWithTheme(<ProfilePreferencesScreen />);
    expect(getByText('Acessibilidade e Leitura')).toBeTruthy();
  });
});
