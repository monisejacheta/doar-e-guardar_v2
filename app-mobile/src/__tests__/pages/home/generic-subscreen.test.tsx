import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import GenericSubscreen from '../../../app/generic-subscreen';
import { mockRouter, mockUseLocalSearchParams } from '../../setup';

describe('Página: Generic Subscreen (src/app/generic-subscreen.tsx)', () => {
  it('deve renderizar título padrão quando parâmetros não forem passados e voltar ao tocar em Voltar', async () => {
    mockUseLocalSearchParams.mockReturnValue({});
    const { getByText } = await renderWithTheme(<GenericSubscreen />);

    expect(getByText('Módulo Operacional')).toBeTruthy();
    await fireEvent.press(getByText('Voltar'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar title e subtitle customizados recebidos via parâmetros da rota', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      title: 'Subtela Customizada',
      subtitle: 'Descrição detalhada da subtela',
    });

    const { getByText } = await renderWithTheme(<GenericSubscreen />);
    expect(getByText('Subtela Customizada')).toBeTruthy();
    expect(getByText('Descrição detalhada da subtela')).toBeTruthy();
  });
});
