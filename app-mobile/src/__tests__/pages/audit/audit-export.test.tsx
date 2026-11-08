import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import AuditExportScreen from '../../../app/audit-export';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Exportar Logs de Auditoria (src/app/audit-export.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve validar e-mail inválido e exportar logs para e-mail institucional válido', async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(<AuditExportScreen />);

    expect(getByText('Exportar Logs de Auditoria')).toBeTruthy();

    await fireEvent.press(getByText('Exportar e Enviar por E-mail'));
    expect(Alert.alert).toHaveBeenCalledWith('E-mail Inválido', expect.any(String));

    (apiModule.requisicaoApi as jest.Mock)
      .mockResolvedValueOnce({ sucesso: true, movimentacoes: [{ id: 1 }] })
      .mockResolvedValueOnce({ sucesso: true });

    await fireEvent.changeText(
      getByPlaceholderText('auditoria@casadacrianca.org.br'),
      'diretoria@casadacrianca.org.br'
    );
    await fireEvent.press(getByText('Exportar e Enviar por E-mail'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Trilha de Auditoria Exportada!', expect.any(String));
    });
  });
});
