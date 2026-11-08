import React from 'react';
import { renderWithTheme, waitFor } from '../../test-utils';
import SettingsCategoriesScreen from '../../../app/settings-categories';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(() =>
    Promise.resolve({
      sucesso: true,
      lotes: [{ categoria: 'Grãos e Cereais', quantidade_atual_pacote: 25 }],
    })
  ),
}));

describe('Página: Categorias de Alimentos (src/app/settings-categories.tsx)', () => {
  it('deve listar as categorias homologadas com a contagem real de pacotes na AWS', async () => {
    const { getByText } = await renderWithTheme(<SettingsCategoriesScreen />);

    await waitFor(() => {
      expect(getByText('6.4 Categorias de Alimentos')).toBeTruthy();
      expect(getByText('Grãos e Cereais')).toBeTruthy();
      expect(getByText('25 pacotes na AWS')).toBeTruthy();
      expect(getByText('Laticínios')).toBeTruthy();
    });
  });
});
