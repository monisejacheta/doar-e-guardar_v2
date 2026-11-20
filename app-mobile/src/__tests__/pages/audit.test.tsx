import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter } from '../setup';
import * as apiModule from '../../services/api';
import AuditScreen from '../../app/audit';
import AuditExportScreen from '../../app/audit-export';
import AuditPeriodScreen from '../../app/audit-period';
import AuditProductScreen from '../../app/audit-product';
import AuditUserScreen from '../../app/audit-user';

describe('Telas de Auditoria e Histórico (src/app/audit*.tsx)', () => {
  beforeEach(() => {
    jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'ajustar_estoque') {
        return { sucesso: true, diferenca: -2, novo_saldo: 8 };
      }
      if (acao === 'enviar_relatorio_completo_email') {
        return { sucesso: true };
      }
      return {
        sucesso: true,
        movimentacoes: [
          {
            id_movimentacao: 'm1',
            operacao: 'Entrada',
            nome_produto: 'Arroz Branco',
            numero_codigo_lote: 'L01',
            quantidade_movimentada_pacote: 10,
            local_descricao: 'Armário A - Prateleira 1',
            id_usuario_responsavel: 'casadacrianca@adm',
            data_hora_movimentacao: '2026-11-18T10:00:00Z',
          },
        ],
        lotes: [
          {
            id_lote_produto: 'l1',
            nome_produto: 'Arroz Branco',
            numero_codigo_lote: 'L01',
            quantidade_atual_pacote: 10,
            local_descricao: 'Armário A - Prateleira 1',
          },
        ],
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve conferir prateleira com ajuste físico na AuditScreen e cobrir todos os tipos de movimentação', async () => {
    jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'ajustar_estoque') {
        return { sucesso: true, diferenca: -2, novo_saldo: 8 };
      }
      return {
        sucesso: true,
        movimentacoes: [
          {
            id_movimentacao: 'm1',
            operacao: 'Entrada',
            nome_produto: 'Arroz Branco',
            numero_codigo_lote: 'L01',
            quantidade_movimentada_pacote: 10,
            local_descricao: 'Armário A - Prateleira 1',
            id_usuario_responsavel: 'casadacrianca@adm',
            data_hora_movimentacao: '2026-11-18T10:00:00Z',
          },
          {
            id_movimentacao: 'm2',
            operacao: 'Saída',
            motivo_saida: 'perda - descarte',
            nome_produto: 'Leite',
            numero_codigo_lote: 'L02',
            quantidade_movimentada_pacote: 2,
            local_descricao: 'Geladeira 1',
            id_usuario_responsavel: 'op',
            data_hora_movimentacao: '2026-11-17T10:00:00Z',
          },
          {
            id_movimentacao: 'm3',
            operacao: 'Ajuste de Contagem',
            nome_produto: 'Feijão',
            numero_codigo_lote: 'L03',
            quantidade_movimentada_pacote: 1,
            local_descricao: 'Armário B',
            id_usuario_responsavel: 'op',
            data_hora_movimentacao: '2026-11-16T10:00:00Z',
          },
        ],
        logs_auditoria: [
          {
            id_log_auditoria: 'log1',
            acao: 'CATEGORIA_OCULTA',
            detalhes: { nome_categoria: 'Doces' },
            id_usuario: 'casadacrianca@adm',
            data_hora: '2026-11-19T12:00:00Z',
          },
        ],
        lotes: [
          {
            id_lote_produto: 'l1',
            nome_produto: 'Arroz Branco',
            numero_codigo_lote: 'L01',
            quantidade_atual_pacote: 10,
            local_descricao: 'Armário A - Prateleira 1',
            codigo_barra_produto: '7891000100103',
          },
        ],
      };
    });

    const { getByLabelText, getByText, getAllByText, getByPlaceholderText } = await renderWithTheme(
      <AuditScreen />
    );
    await waitFor(() => expect(getByText('Saúde da Despensa')).toBeTruthy());

    await fireEvent.press(getByLabelText('Conferir Prateleira'));
    await waitFor(() => expect(getByPlaceholderText('Ex: Arroz, Armário A, 78910...')).toBeTruthy());
    await fireEvent.changeText(getByPlaceholderText('Ex: Arroz, Armário A, 78910...'), 'Arroz');

    // Seleciona o lote listado no modal de busca (com dois pontos 'Lote: L01')
    const loteModalItem = await waitFor(() => getAllByText('Lote: L01'));
    await fireEvent.press(loteModalItem[loteModalItem.length - 1]);

    // Testa validações do ajuste físico: igual ao sistema -> sem divergência -> sem motivo -> válido
    await waitFor(() => expect(getByPlaceholderText('0')).toBeTruthy());
    await fireEvent.press(getByLabelText('Salvar Nova Quantidade'));
    expect(Alert.alert).toHaveBeenCalledWith('Sem Divergência', expect.any(String));

    await fireEvent.changeText(getByPlaceholderText('0'), '');
    await fireEvent.press(getByLabelText('Salvar Nova Quantidade'));
    expect(Alert.alert).toHaveBeenCalledWith('Valor Inválido', expect.any(String));

    await fireEvent.changeText(getByPlaceholderText('0'), '8');
    await fireEvent.press(getByLabelText('Salvar Nova Quantidade'));
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', expect.any(String));

    await fireEvent.changeText(
      getByPlaceholderText('Ex: Embalagem danificada não registrada.'),
      '2 pacotes amassados'
    );
    await fireEvent.press(getByLabelText('Salvar Nova Quantidade'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Contagem Atualizada!', expect.any(String), expect.any(Array))
    );

    // Reabre ajuste para cobrir falha de salvamento e botão Fechar ajuste físico
    await fireEvent.press(getByLabelText('Conferir Prateleira'));
    await waitFor(() => expect(getByPlaceholderText('Ex: Arroz, Armário A, 78910...')).toBeTruthy());
    const loteModalItem2 = getAllByText('Lote: L01');
    await fireEvent.press(loteModalItem2[loteModalItem2.length - 1]);
    await waitFor(() => expect(getByPlaceholderText('0')).toBeTruthy());
    await fireEvent.changeText(getByPlaceholderText('0'), '9');
    await fireEvent.changeText(
      getByPlaceholderText('Ex: Embalagem danificada não registrada.'),
      'Conferência secundária'
    );
    jest
      .spyOn(apiModule, 'requisicaoApi')
      .mockResolvedValueOnce({ sucesso: false, mensagem: 'Erro ao gravar ajuste' });
    await fireEvent.press(getByLabelText('Salvar Nova Quantidade'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Não foi possível salvar', expect.any(String))
    );

    await fireEvent.press(getByLabelText('Fechar ajuste físico'));
    await fireEvent.press(getByLabelText('Voltar'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('deve enviar histórico por e-mail em AuditExportScreen', async () => {
    const { getByPlaceholderText, getByLabelText } = await renderWithTheme(
      <AuditExportScreen />
    );
    await fireEvent.changeText(
      getByPlaceholderText('contato@casadacrianca.org.br'),
      'coord@casadacrianca.org.br'
    );
    await fireEvent.press(getByLabelText('Enviar Histórico por E-mail'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Histórico Enviado!', expect.any(String))
    );
  });

  it('deve renderizar subtelas de filtro por período, produto e usuário', async () => {
    for (const tela of [
      <AuditPeriodScreen key="p" />,
      <AuditProductScreen key="pr" />,
      <AuditUserScreen key="u" />,
    ]) {
      const { getByText } = await renderWithTheme(tela);
      await waitFor(() => expect(getByText('Voltar')).toBeTruthy());
    }
  });
});
