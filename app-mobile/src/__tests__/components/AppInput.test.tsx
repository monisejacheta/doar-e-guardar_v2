import React from 'react';
import { renderWithTheme, fireEvent } from '../test-utils';
import { AppInput } from '../../components/common/AppInput';

describe('Componente AppInput', () => {
  it('deve renderizar rótulo, mensagem de aviso e permitir alternar visibilidade de senha', async () => {
    const aoMudarTexto = jest.fn();
    const { getByText, getByLabelText } = await renderWithTheme(
      <AppInput
        rotulo="Sua Senha"
        eSenha={true}
        mensagemAviso="Senha obrigatória"
        onChangeText={aoMudarTexto}
      />
    );

    expect(getByText('Sua Senha')).toBeTruthy();
    expect(getByText('Senha obrigatória')).toBeTruthy();

    await fireEvent.changeText(getByLabelText('Sua Senha'), '123456');
    expect(aoMudarTexto).toHaveBeenCalledWith('123456');

    const botaoMostrar = getByText('Mostrar');
    await fireEvent.press(botaoMostrar);
    expect(getByText('Ocultar')).toBeTruthy();
  });
});
