import React from 'react';
import { renderWithTheme } from '../../test-utils';
import ExploreRedirectScreen from '../../../app/explore';
import { mockRouter } from '../../setup';

describe('Página: Explore Redirect (src/app/explore.tsx)', () => {
  it('deve redirecionar automaticamente para /home ao montar', async () => {
    const { toJSON } = await renderWithTheme(<ExploreRedirectScreen />);
    expect(toJSON()).toBeTruthy();
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });
});
