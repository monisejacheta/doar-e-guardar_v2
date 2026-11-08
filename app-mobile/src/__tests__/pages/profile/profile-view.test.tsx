import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import ProfileViewScreen from '../../../app/profile-view';
import { mockRouter } from '../../setup';

describe('Página: Visualizar Perfil Detalhado (src/app/profile-view.tsx)', () => {
  it('deve exibir todos os campos institucionais do colaborador e permitir voltar', async () => {
    const { getByText } = await renderWithTheme(<ProfileViewScreen />);

    expect(getByText('2.1.1 Dados do Colaborador')).toBeTruthy();
    expect(getByText('Nome de Exibição')).toBeTruthy();
    expect(getByText('E-mail Institucional')).toBeTruthy();
    expect(getByText('Identificador Único (UID)')).toBeTruthy();
    expect(getByText('Papel / Permissão')).toBeTruthy();
    expect(getByText('Unidade Vinculada')).toBeTruthy();

    await fireEvent.press(getByText('Voltar ao Perfil'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
