import React from 'react';
import { renderWithTheme, fireEvent } from '../test-utils';
import { BottomNavBar } from '../../components/common/BottomNavBar';
import { mockRouter, mockUsePathname } from '../setup';

describe('Componente BottomNavBar', () => {
  it('deve renderizar BottomNavBar, navegar pelas abas e abrir o menu Mais Opções', async () => {
    mockUsePathname.mockReturnValue('/home');
    const { getByText } = await renderWithTheme(<BottomNavBar />);

    expect(getByText('Início')).toBeTruthy();
    expect(getByText('Estoque')).toBeTruthy();
    expect(getByText('Dora IA')).toBeTruthy();
    expect(getByText('Avisos')).toBeTruthy();

    await fireEvent.press(getByText('Estoque'));
    expect(mockRouter.push).toHaveBeenCalledWith('/stock');

    await fireEvent.press(getByText('Mais'));
    expect(getByText('Mais Opções')).toBeTruthy();
    await fireEvent.press(getByText('Relatórios'));
    expect(mockRouter.push).toHaveBeenCalledWith('/reports');

    mockUsePathname.mockReturnValue('/');
    const { toJSON } = await renderWithTheme(<BottomNavBar />);
    expect(toJSON()).toBeNull();
  });
});
