import React from 'react';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter } from '../setup';
import * as apiModule from '../../services/api';
import DiagnosticScreen from '../../app/diagnostic';
import DiagnosticApisScreen from '../../app/diagnostic-apis';
import DiagnosticAwsScreen from '../../app/diagnostic-aws';
import DiagnosticConfigScreen from '../../app/diagnostic-config';
import DiagnosticDatabaseScreen from '../../app/diagnostic-database';

describe('Telas de Diagnóstico (src/app/diagnostic*.tsx)', () => {
  beforeEach(() => {
    jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValue({
      sucesso: true,
      status_geral: 'OPERACIONAL',
      lotes: [],
      movimentacoes: [],
      locais: [],
      categorias: [],
      doadores: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar DiagnosticScreen e acionar verificação completa', async () => {
    const { getByText } = await renderWithTheme(<DiagnosticScreen />);
    await waitFor(() => expect(getByText('Testar Tudo Agora')).toBeTruthy());
    await fireEvent.press(getByText('Testar Tudo Agora'));
    await fireEvent.press(getByText('Voltar'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('deve renderizar todas as subtelas de diagnóstico (APIs, AWS, Config e Banco)', async () => {
    const { Alert } = require('react-native');
    const apis = await renderWithTheme(<DiagnosticApisScreen />);
    await waitFor(() => expect(apis.getByLabelText('Voltar para Status do App')).toBeTruthy());
    await fireEvent.changeText(apis.getByPlaceholderText('Ex: 7891000100103'), '12');
    await fireEvent.press(apis.getByText('Testar Busca pelo Código'));
    expect(Alert.alert).toHaveBeenCalledWith('Código Inválido', expect.any(String));

    await fireEvent.changeText(apis.getByPlaceholderText('Ex: 7891000100103'), '7891000100103');
    await fireEvent.press(apis.getByText('Testar Busca pelo Código'));

    const subtelas = [
      <DiagnosticAwsScreen key="aws" />,
      <DiagnosticConfigScreen key="cfg" />,
      <DiagnosticDatabaseScreen key="db" />,
    ];

    for (const tela of subtelas) {
      const { getByLabelText } = await renderWithTheme(tela);
      await waitFor(() => expect(getByLabelText('Voltar para Status do App')).toBeTruthy());
    }
  });
});
