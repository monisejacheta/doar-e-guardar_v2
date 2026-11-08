import React from 'react';
import { renderWithTheme, fireEvent, waitFor } from '../../test-utils';
import AuditProductScreen from '../../../app/audit-product';
import * as apiModule from '../../../services/api';

jest.mock('../../../services/api', () => ({
  requisicaoApi: jest.fn(),
}));

describe('Página: Auditoria por Produto (src/app/audit-product.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.requisicaoApi as jest.Mock).mockResolvedValue({
      sucesso: true,
      movimentacoes: [
        {
          id_movimentacao: 'mp1',
          nome_produto: 'Farinha de Mandioca',
          codigo_barra_produto: '7893334445556',
          operacao: 'Entrada',
          quantidade_movimentada_pacote: 5,
          numero_codigo_lote: 'LT-FAR',
          local_descricao: 'Armário B - Prateleira 1',
          id_usuario_responsavel: 'João',
        },
      ],
    });
  });

  it('deve agrupar o rastro de auditoria por produto e permitir filtrar por texto', async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(<AuditProductScreen />);

    await waitFor(() => {
      expect(getByText('Auditoria por Produto')).toBeTruthy();
      expect(getByText('Farinha de Mandioca')).toBeTruthy();
    });

    await fireEvent.changeText(
      getByPlaceholderText('Filtrar por nome do produto ou EAN...'),
      'ProdutoInexistente'
    );
    expect(getByText('Nenhum rastro de auditoria encontrado para o filtro informado.')).toBeTruthy();
  });
});
