import React from 'react';
import { renderWithTheme, fireEvent } from '../test-utils';
import { AppButton } from '../../components/common/AppButton';

describe('Componente AppButton', () => {
  it('deve renderizar o título e disparar onPress ao ser tocado', async () => {
    const aoPressionar = jest.fn();
    const { getByText } = await renderWithTheme(<AppButton title="Confirmar Entrada" onPress={aoPressionar} />);

    await fireEvent.press(getByText('Confirmar Entrada'));
    expect(aoPressionar).toHaveBeenCalledTimes(1);
  });

  it('deve suportar variantes (secondary, danger, outline) e estado loading/disabled', async () => {
    const aoPressionar = jest.fn();
    const { queryByText, rerender } = await renderWithTheme(
      <AppButton title="Carregando" onPress={aoPressionar} loading={true} variant="outline" />
    );

    expect(queryByText('Carregando')).toBeNull();

    await rerender(<AppButton title="Secundário" onPress={aoPressionar} variant="secondary" />);
    expect(queryByText('Secundário')).toBeTruthy();

    await rerender(<AppButton title="Excluir" onPress={aoPressionar} variant="danger" disabled={true} />);
    expect(queryByText('Excluir')).toBeTruthy();
  });
});
