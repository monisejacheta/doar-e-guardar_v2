import React from 'react';
import { act, fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter } from '../setup';
import * as apiModule from '../../services/api';
import DoraScreen from '../../app/dora';

describe('Página Assistente Dora (src/app/dora.tsx)', () => {
  it('deve sincronizar estoque, enviar pergunta, abrir modal sobre e limpar conversa', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValue({
      sucesso: true,
      lotes: [
        {
          id_lote_produto: 'l1',
          nome_produto: 'Leite Integral UHT',
          categoria: 'Laticínios',
          numero_codigo_lote: 'L1',
          quantidade_atual_pacote: 10,
          data_validade_lote: '2026-11-25',
          local_descricao: 'Geladeira 1 - Prateleira Central',
        },
        {
          id_lote_produto: 'l2',
          nome_produto: 'Arroz Branco',
          categoria: 'Grãos',
          numero_codigo_lote: 'L2',
          quantidade_atual_pacote: 15,
          data_validade_lote: '2027-06-30',
          local_descricao: 'Armário A - Prateleira 1',
        },
      ],
      movimentacoes: [],
    });

    const { getByText, getByLabelText } = await renderWithTheme(<DoraScreen />);

    await waitFor(() => {
      expect(getByText('online • 25 pcts acompanhados')).toBeTruthy();
    });

    // Abre modal de apresentação com vídeo DoraGreeting.mp4
    await fireEvent.press(getByLabelText('Ver informações sobre a Dora'));
    expect(getByText('Oi! Eu sou a Dora 👋')).toBeTruthy();
    await fireEvent.press(getByLabelText('Entendi, voltar para a conversa com a Dora'));

    // Envia pergunta
    await fireEvent.changeText(
      getByLabelText('Campo de mensagem para a assistente Dora'),
      'Quais produtos vencem primeiro?'
    );
    await act(async () => {
      await fireEvent.press(getByLabelText('Enviar mensagem para a Dora'));
    });

    await waitFor(() => {
      expect(getByText('Monitoramento de Validades')).toBeTruthy();
    });

    // Sugestões de voz / rápidas e limpar conversa
    await fireEvent.press(getByLabelText('Alternar sugestões rápidas'));
    expect(getByText('Toque em uma pergunta pronta ou use o ditado do teclado:')).toBeTruthy();

    await fireEvent.press(getByLabelText('Limpar conversa'));
    await fireEvent.press(getByLabelText('Voltar para tela anterior'));
    expect(mockRouter.back).toHaveBeenCalled();

    spyApi.mockRestore();
  });
});
