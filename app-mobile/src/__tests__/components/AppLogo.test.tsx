import React from 'react';
import { renderWithTheme } from '../test-utils';
import { AppLogo } from '../../components/common/AppLogo';

describe('Componente AppLogo', () => {
  it('deve renderizar AppLogo nos tamanhos pequeno, medio e grande', async () => {
    const { getByText, rerender } = await renderWithTheme(<AppLogo tamanho="pequeno" />);
    expect(getByText('▲')).toBeTruthy();
    await rerender(<AppLogo tamanho="medio" />);
    await rerender(<AppLogo tamanho="grande" />);
  });
});
