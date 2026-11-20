import React from 'react';
import { fireEvent, renderWithTheme } from '../test-utils';
import { mockRouter, mockUsePathname } from '../setup';
import { ActionCard } from '../../components/common/ActionCard';
import { AppButton } from '../../components/common/AppButton';
import { AppIcon } from '../../components/common/AppIcon';
import { AppInput } from '../../components/common/AppInput';
import { AppLogo } from '../../components/common/AppLogo';
import { AppDateInput } from '../../components/common/AppDateInput';
import { AppNumericInput } from '../../components/common/AppNumericInput';
import { BottomNavBar } from '../../components/common/BottomNavBar';
import { ProductDetailModal } from '../../components/common/ProductDetailModal';

describe('Componentes comuns (src/components/common/)', () => {
  it('ActionCard deve renderizar título/descrição e disparar aoTocar', async () => {
    const aoTocar = jest.fn();
    const { getByText, rerender } = await renderWithTheme(
      <ActionCard
        titulo="Entrada de Alimentos"
        descricao="Cadastrar novos lotes"
        iconName="camera"
        aoTocar={aoTocar}
        destaque={true}
      />
    );

    await fireEvent.press(getByText('Entrada de Alimentos'));
    expect(aoTocar).toHaveBeenCalledTimes(1);

    await rerender(
      <ActionCard
        titulo="Saída"
        descricao="Baixar itens"
        iconName="box"
        aoTocar={aoTocar}
        corDestaque="#EF4444"
      />
    );
    expect(getByText('Saída')).toBeTruthy();
  });

  it('AppButton deve suportar variantes, loading, disabled e onPress', async () => {
    const onPress = jest.fn();
    const { getByText, queryByText, rerender } = await renderWithTheme(
      <AppButton title="Salvar" onPress={onPress} variant="primary" />
    );
    await fireEvent.press(getByText('Salvar'));
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<AppButton title="Carregando" onPress={onPress} loading={true} variant="outline" />);
    expect(queryByText('Carregando')).toBeNull();

    await rerender(<AppButton title="Secundário" onPress={onPress} variant="secondary" />);
    expect(getByText('Secundário')).toBeTruthy();

    await rerender(<AppButton title="Excluir" onPress={onPress} variant="danger" disabled={true} />);
    expect(getByText('Excluir')).toBeTruthy();
  });

  it('AppIcon e AppLogo devem renderizar variantes e tamanhos', async () => {
    const { getByLabelText, rerender } = await renderWithTheme(
      <>
        <AppIcon name="box" variant="primary" />
        <AppIcon name="bell" variant="secondary" />
        <AppIcon name="clock" variant="amber" />
        <AppIcon name="x" variant="danger" />
        <AppIcon name="user" variant="text" />
        <AppLogo tamanho="grande" />
      </>
    );
    expect(
      getByLabelText(
        'Símbolo da Casa da Criança: uma casinha acolhedora formada por caixas de mantimentos'
      )
    ).toBeTruthy();
    await rerender(<AppLogo tamanho="pequeno" />);
  });

  it('AppInput deve alternar visualização de senha e exibir mensagemAviso', async () => {
    const onChange = jest.fn();
    const { getByText, getByLabelText } = await renderWithTheme(
      <AppInput
        rotulo="Senha"
        eSenha={true}
        mensagemAviso="Campo obrigatório"
        onChangeText={onChange}
      />
    );
    expect(getByText('Campo obrigatório')).toBeTruthy();
    await fireEvent.press(getByText('Mostrar'));
    expect(getByText('Ocultar')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Senha'), '123456');
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('AppNumericInput deve incrementar, decrementar e respeitar min/max', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await renderWithTheme(
      <AppNumericInput rotulo="Pacotes" value="5" min={1} max={6} onChangeText={onChangeText} />
    );

    await fireEvent.press(getByLabelText('Aumentar 1 em Pacotes'));
    expect(onChangeText).toHaveBeenCalledWith('6');

    await fireEvent.press(getByLabelText('Diminuir 1 em Pacotes'));
    expect(onChangeText).toHaveBeenCalledWith('4');

    await fireEvent.changeText(getByLabelText('Pacotes'), '99');
    expect(onChangeText).toHaveBeenCalledWith('6');

    await fireEvent.changeText(getByLabelText('Pacotes'), '');
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('AppDateInput deve aplicar máscara, abrir calendário modal, bloquear passado e selecionar hoje', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText, getByText } = await renderWithTheme(
      <AppDateInput
        rotulo="Validade"
        value="20/11/2026"
        bloquearDatasPassadas={true}
        onChangeText={onChangeText}
      />
    );

    await fireEvent.changeText(getByLabelText('Validade'), '25122026');
    expect(onChangeText).toHaveBeenCalledWith('25/12/2026');

    await fireEvent.press(getByLabelText('Abrir calendário para Validade'));
    expect(getByText('Selecionar Data')).toBeTruthy();

    await fireEvent.press(getByLabelText('Mês anterior'));
    await fireEvent.press(getByLabelText('Próximo mês'));
    await fireEvent.press(getByLabelText('Ano anterior'));
    await fireEvent.press(getByLabelText('Próximo ano'));
    await fireEvent.press(getByLabelText('Selecionar data de hoje'));
    expect(onChangeText).toHaveBeenCalled();
  });

  it('BottomNavBar deve ocultar na tela de login e navegar nas abas + menu Mais', async () => {
    mockUsePathname.mockReturnValue('/');
    const { queryByText, rerender } = await renderWithTheme(<BottomNavBar />);
    expect(queryByText('Início')).toBeNull();

    mockUsePathname.mockReturnValue('/home');
    await rerender(<BottomNavBar />);
    await fireEvent.press(queryByText('Estoque')!);
    expect(mockRouter.push).toHaveBeenCalledWith('/stock');

    await fireEvent.press(queryByText('Mais')!);
    expect(queryByText('Mais Opções')).toBeTruthy();
    await fireEvent.press(queryByText('Histórico')!);
    expect(mockRouter.push).toHaveBeenCalledWith('/audit');
  });

  it('ProductDetailModal deve exibir detalhes, alerta abaixo do mínimo e selecionar lote FEFO', async () => {
    const onClose = jest.fn();
    const onSelectLote = jest.fn();
    const produto = {
      codigo_barra_produto: '7891000100103',
      nome_produto: 'Leite Integral',
      categoria: 'Laticínios',
      quantidade_total: 4,
      estoque_minimo: 10,
      lotes: [
        {
          id_lote_produto: 'l1',
          numero_codigo_lote: 'LT-01',
          quantidade_atual_pacote: 2,
          data_validade_lote: '2020-01-01',
          local_descricao: 'Geladeira 1 - Prateleira Central',
        },
        {
          id_lote_produto: 'l2',
          numero_codigo_lote: 'LT-02',
          quantidade_atual_pacote: 2,
          data_validade_lote: '2099-12-31',
          local_descricao: 'Geladeira 1 - Gaveta Superior',
        },
      ],
    };

    const { getByText, getByLabelText } = await renderWithTheme(
      <ProductDetailModal
        visible={true}
        produto={produto}
        onClose={onClose}
        highlightFefoFirst={true}
        instructionText="Selecione um lote"
        onSelectLote={onSelectLote}
      />
    );

    expect(getByText('Leite Integral')).toBeTruthy();
    expect(getByText(/Estoque abaixo do mínimo/)).toBeTruthy();
    expect(getByText('Vencido')).toBeTruthy();

    await fireEvent.press(getByText('Lote LT-01'));
    expect(onSelectLote).toHaveBeenCalledWith(produto.lotes[0]);

    await fireEvent.press(getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalled();
  });
});
