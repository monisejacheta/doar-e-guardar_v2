import React from 'react';
import { Alert } from 'react-native';
import { renderWithTheme, fireEvent } from '../../test-utils';
import NotificationsConfigScreen from '../../../app/notifications-config';

describe('Página: Configurar Alertas de Validade (src/app/notifications-config.tsx)', () => {
  it('deve exibir switches de regras preventivas FEFO e salvar preferências', async () => {
    const { getByText } = await renderWithTheme(<NotificationsConfigScreen />);

    expect(getByText('Configurar Alertas de Validade')).toBeTruthy();
    expect(getByText('Alerta Crítico (≤ 7 dias para vencer)')).toBeTruthy();
    expect(getByText('Alerta Preventivo FEFO (≤ 30 dias)')).toBeTruthy();
    expect(getByText('Aviso de Estoque Mínimo')).toBeTruthy();
    expect(getByText('Sugestões Anti-Desperdício da Dora')).toBeTruthy();

    await fireEvent.press(getByText('Salvar Preferências de Alerta'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Preferências Salvas',
      'Regras de alerta FEFO atualizadas com sucesso.',
      expect.any(Array)
    );
  });
});
