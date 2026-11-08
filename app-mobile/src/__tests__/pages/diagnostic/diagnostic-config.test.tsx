import React from 'react';
import { renderWithTheme, fireEvent } from '../../test-utils';
import DiagnosticConfigScreen from '../../../app/diagnostic-config';
import { mockRouter } from '../../setup';

describe('Página: Parâmetros e Integrações (src/app/diagnostic-config.tsx)', () => {
  it('deve listar todos os parâmetros técnicos da infraestrutura AWS e cascata EAN', async () => {
    const { getByText } = await renderWithTheme(<DiagnosticConfigScreen />);

    expect(getByText('9.4 Parâmetros e Integrações')).toBeTruthy();
    expect(getByText('Endpoint AWS Lambda')).toBeTruthy();
    expect(getByText('Timeout de Requisição HTTP')).toBeTruthy();
    expect(getByText('Política de Prateleiras')).toBeTruthy();

    await fireEvent.press(getByText('Voltar ao Diagnóstico'));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
