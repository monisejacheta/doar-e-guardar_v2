import React from 'react';
import { renderWithTheme } from '../test-utils';
import { AppIcon } from '../../components/common/AppIcon';

describe('Componente AppIcon', () => {
  it('deve renderizar AppIcon com todas as variantes semânticas de cor', async () => {
    const { toJSON, rerender } = await renderWithTheme(<AppIcon name="box" variant="primary" />);
    expect(toJSON()).toBeTruthy();
    await rerender(<AppIcon name="bell" variant="secondary" />);
    await rerender(<AppIcon name="alert-triangle" variant="amber" />);
    await rerender(<AppIcon name="log-out" variant="danger" />);
    await rerender(<AppIcon name="user" variant="text" />);
    await rerender(<AppIcon name="settings" variant="neutral" color="#000" />);
  });
});
