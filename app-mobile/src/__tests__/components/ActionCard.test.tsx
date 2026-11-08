import React from 'react';
import { renderWithTheme, fireEvent } from '../test-utils';
import { ActionCard } from '../../components/common/ActionCard';

describe('Componente ActionCard', () => {
  it('deve renderizar ActionCard e acionar callback ao tocar', async () => {
    const aoTocar = jest.fn();
    const { getByText } = await renderWithTheme(
      <ActionCard
        titulo="Consultar Estoque"
        descricao="Veja todos os lotes"
        iconName="box"
        aoTocar={aoTocar}
        destaque={true}
      />
    );

    expect(getByText('Consultar Estoque')).toBeTruthy();
    expect(getByText('Veja todos os lotes')).toBeTruthy();
    await fireEvent.press(getByText('Consultar Estoque'));
    expect(aoTocar).toHaveBeenCalledTimes(1);
  });
});
