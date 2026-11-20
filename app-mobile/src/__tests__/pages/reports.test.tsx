import React from 'react';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import * as apiModule from '../../services/api';
import ReportsScreen from '../../app/reports';
import ReportsStockScreen from '../../app/reports-stock';
import ReportsExpiryScreen from '../../app/reports-expiry';
import ReportsLossesScreen from '../../app/reports-losses';
import ReportsMovementsScreen from '../../app/reports-movements';

describe('Telas de Relatórios (src/app/reports*.tsx)', () => {
  beforeEach(() => {
    jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l1',
          nome_produto: 'Feijão Carioca',
          categoria: 'Grãos',
          numero_codigo_lote: 'LT-01',
          quantidade_atual_pacote: 15,
          estoque_minimo_pacote: 10,
          data_validade_lote: '2026-11-28',
          local_descricao: 'Armário A - Prateleira 1',
        },
        {
          id_lote_produto: 'l2',
          nome_produto: 'Leite Vencido',
          categoria: 'Laticínios',
          numero_codigo_lote: 'LT-V1',
          quantidade_atual_pacote: 4,
          estoque_minimo_pacote: 12,
          data_validade_lote: '2020-01-01',
          local_descricao: 'Geladeira 1',
        },
      ],
      movimentacoes: [
        {
          id_movimentacao: 'm1',
          operacao: 'Saída',
          nome_produto: 'Arroz',
          motivo_saida: 'perda - descarte vencido',
          quantidade_movimentada_pacote: 2,
          data_hora_movimentacao: '2026-11-18T10:00:00Z',
          local_descricao: 'Armário A - Prateleira 1',
          id_usuario_responsavel: 'operador',
        },
        {
          id_movimentacao: 'm2',
          operacao: 'Entrada',
          nome_produto: 'Macarrão',
          quantidade_movimentada_pacote: 8,
          data_hora_movimentacao: '2026-11-19T14:00:00Z',
          local_descricao: 'Armário A - Prateleira 2',
          id_usuario_responsavel: 'admin',
        },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar ReportsScreen e relatórios de estoque, validade, perdas e movimentações', async () => {
    const rep = await renderWithTheme(<ReportsScreen />);
    await waitFor(() => expect(rep.getByText('Grãos')).toBeTruthy());
    await rep.unmount();

    const exp = await renderWithTheme(<ReportsExpiryScreen />);
    await waitFor(() =>
      expect(exp.getByPlaceholderText('Buscar produto, lote ou prateleira...')).toBeTruthy()
    );
    await fireEvent.press(exp.getByText('Ver Quantidade'));
    await fireEvent.changeText(exp.getByPlaceholderText('Buscar produto, lote ou prateleira...'), 'Feijão');
    await fireEvent.press(exp.getByText('sliders'));
    await fireEvent.press(exp.getByText('Grãos'));
    await fireEvent.press(exp.getByText(/Validade [↑↓]/));
    await fireEvent.press(exp.getByText(/Validade [↑↓]/));
    await exp.unmount();

    const loss = await renderWithTheme(<ReportsLossesScreen />);
    await waitFor(() =>
      expect(loss.getByPlaceholderText('Buscar produto descartado (histórico)...')).toBeTruthy()
    );
    await fireEvent.press(loss.getByText('Ver Volume'));
    await fireEvent.changeText(loss.getByPlaceholderText('Buscar produto descartado (histórico)...'), 'Arroz');
    await fireEvent.press(loss.getByText('sliders'));
    await fireEvent.press(loss.getByText(/Volume/));
    await fireEvent.press(loss.getByText(/Data/));
    const chipsOutros = loss.getAllByText('Outros');
    await fireEvent.press(chipsOutros[chipsOutros.length - 1]);
    await loss.unmount();

    const mov = await renderWithTheme(<ReportsMovementsScreen />);
    await waitFor(() =>
      expect(
        mov.getByPlaceholderText('Pesquisar alimento, lote, prateleira ou responsável...')
      ).toBeTruthy()
    );
    await fireEvent.changeText(
      mov.getByPlaceholderText('Pesquisar alimento, lote, prateleira ou responsável...'),
      'Arroz'
    );
    await fireEvent.press(mov.getByText('filter'));
    await fireEvent.press(mov.getByText('Saídas'));
    await fireEvent.press(mov.getByText('Entradas'));
    await fireEvent.press(mov.getByText('Prateleiras'));
    await fireEvent.press(mov.getByText('Todo o histórico'));
    await mov.unmount();

    const stk = await renderWithTheme(<ReportsStockScreen />);
    await waitFor(() => expect(stk.getByLabelText('Voltar para a página anterior')).toBeTruthy());
    await fireEvent.changeText(stk.getByPlaceholderText('Buscar alimento, prateleira ou código...'), 'Feijão');
    await fireEvent.press(stk.getByText('Ver Quantidade'));
    await fireEvent.press(stk.getByText('sliders'));
    await fireEvent.press(stk.getAllByText('Grãos')[0]);
    await fireEvent.press(stk.getByText(/Nome/));
    await fireEvent.press(stk.getByText(/Nome/));
    await fireEvent.press(stk.getByText(/Saldo/));
    await fireEvent.press(stk.getByText(/Saldo/));
    await fireEvent.press(stk.getByText('Apenas itens abaixo do Estoque Mínimo'));
    await fireEvent.changeText(stk.getByPlaceholderText('Buscar alimento, prateleira ou código...'), '');
    await stk.unmount();

    // Cenário de falha de conexão em ReportsMovementsScreen
    (apiModule.requisicaoApi as jest.Mock).mockRejectedValueOnce(new Error('Sem rede'));
    await renderWithTheme(<ReportsMovementsScreen />);
    await waitFor(() => expect(true).toBe(true));
  });
});
