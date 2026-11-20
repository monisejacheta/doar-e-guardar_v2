import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, renderWithTheme } from '../test-utils';
import { mockVideoPlayer } from '../setup';
import { DoraAboutModal } from '../../components/dora/DoraAboutModal';
import { DoraComposer } from '../../components/dora/DoraComposer';
import { DoraHeader } from '../../components/dora/DoraHeader';
import { DoraMessageBubble } from '../../components/dora/DoraMessageBubble';
import { DoraStructuredText } from '../../components/dora/DoraStructuredText';
import { criarCoresChatDora, criarMensagemBoasVindas } from '../../components/dora/types';
import { lightTheme } from '../../theme/themes';

describe('Componentes da Assistente Dora e Audiovisual (src/components/dora/)', () => {
  const coresChat = criarCoresChatDora(lightTheme, 'light');

  it('DoraAboutModal deve inicializar vídeo DoraGreeting.mp4 (expo-video) e tratar eventos/fallback', async () => {
    const onClose = jest.fn();
    let capturedCallbacks: Record<string, (arg?: any) => void> = {};
    (mockVideoPlayer.addListener as jest.Mock).mockImplementation((ev: string, cb: any) => {
      capturedCallbacks[ev] = cb;
      return { remove: jest.fn() };
    });

    const { getByText, getByTestId, queryByTestId, getByLabelText } = await renderWithTheme(
      <DoraAboutModal visible={true} coresChat={coresChat} onClose={onClose} />
    );

    expect(getByText('Oi! Eu sou a Dora 👋')).toBeTruthy();
    expect(getByTestId('expo-video-view')).toBeTruthy();
    expect(mockVideoPlayer.play).toHaveBeenCalled();

    // Simula fim do vídeo (playToEnd -> pause)
    capturedCallbacks.playToEnd?.();
    expect(mockVideoPlayer.pause).toHaveBeenCalled();

    // Simula erro de reprodução -> fallback para imagem do avatar
    await act(async () => {
      capturedCallbacks.statusChange?.({ status: 'error' });
    });
    expect(queryByTestId('expo-video-view')).toBeNull();
    expect(getByLabelText('Foto da assistente Dora')).toBeTruthy();

    await fireEvent.press(getByLabelText('Entendi, voltar para a conversa com a Dora'));
    expect(onClose).toHaveBeenCalled();
  });

  it('DoraHeader deve exibir estado online/digitando e acionar callbacks', async () => {
    const onVoltar = jest.fn();
    const onAbrirSobre = jest.fn();
    const onSincronizar = jest.fn();
    const onLimpar = jest.fn();

    const { getByText, getByLabelText, rerender } = await renderWithTheme(
      <DoraHeader
        coresChat={coresChat}
        processandoIa={false}
        carregandoEstoque={false}
        totalPacotesAtivos={42}
        onVoltar={onVoltar}
        onAbrirSobre={onAbrirSobre}
        onSincronizar={onSincronizar}
        onLimparConversa={onLimpar}
      />
    );

    expect(getByText('online • 42 pcts acompanhados')).toBeTruthy();
    await fireEvent.press(getByLabelText('Voltar para tela anterior'));
    await fireEvent.press(getByLabelText('Ver informações sobre a Dora'));
    await fireEvent.press(getByLabelText('Atualizar leitura do estoque'));
    await fireEvent.press(getByLabelText('Limpar conversa'));

    expect(onVoltar).toHaveBeenCalled();
    expect(onAbrirSobre).toHaveBeenCalled();
    expect(onSincronizar).toHaveBeenCalled();
    expect(onLimpar).toHaveBeenCalled();

    await rerender(
      <DoraHeader
        coresChat={coresChat}
        processandoIa={true}
        carregandoEstoque={false}
        totalPacotesAtivos={42}
        onVoltar={onVoltar}
        onAbrirSobre={onAbrirSobre}
        onSincronizar={onSincronizar}
        onLimparConversa={onLimpar}
      />
    );
    expect(getByText('digitando...')).toBeTruthy();
  });

  it('DoraComposer deve alternar comandos rápidos e enviar mensagem', async () => {
    const onChangeTexto = jest.fn();
    const onToggle = jest.fn();
    const onEnviar = jest.fn();

    const { getByLabelText, getByText } = await renderWithTheme(
      <DoraComposer
        entradaTexto="Oi Dora"
        processandoIa={false}
        exibirComandosVoz={true}
        coresChat={coresChat}
        onChangeTexto={onChangeTexto}
        onToggleComandosVoz={onToggle}
        onEnviar={onEnviar}
      />
    );

    await fireEvent.press(getByLabelText('Alternar sugestões rápidas'));
    expect(onToggle).toHaveBeenCalled();

    await fireEvent.changeText(getByLabelText('Campo de mensagem para a assistente Dora'), 'Receita');
    expect(onChangeTexto).toHaveBeenCalledWith('Receita');

    await fireEvent.press(getByLabelText('Enviar mensagem para a Dora'));
    expect(onEnviar).toHaveBeenCalled();

    await fireEvent.press(getByText('⏰ Quais produtos vencem primeiro?'));
    expect(onEnviar).toHaveBeenCalledWith('⏰ Quais produtos vencem primeiro?');
  });

  it('DoraMessageBubble e DoraStructuredText devem renderizar usuário, receita, predições, atalho e sugestões', async () => {
    const onSobre = jest.fn();
    const onAtalho = jest.fn();
    const onSugestao = jest.fn();

    const { getByText, rerender } = await renderWithTheme(
      <DoraMessageBubble
        mensagem={{ id: 'u1', autor: 'usuario', horario: '10:00', texto: 'Olá Dora' }}
        ehUltimaMensagem={false}
        coresChat={coresChat}
        onAbrirSobre={onSobre}
        onNavegarAtalho={onAtalho}
        onSelecionarSugestao={onSugestao}
      />
    );
    expect(getByText('Olá Dora')).toBeTruthy();

    const msgDora = {
      ...criarMensagemBoasVindas('test'),
      receita: {
        id: 'r1',
        titulo: 'Arroz Doce',
        rendimento: '20 porções',
        tempoPreparo: '30 min',
        ingredientesEstoque: '• Leite e Arroz',
        ingredientesComplementares: '• Canela',
        modoPreparo: '1. Cozinhar',
        dicaDora: 'Use FEFO',
        fonteNome: 'TudoGostoso',
        fonteUrl: 'https://www.tudogostoso.com.br',
      },
      predicoes: [
        {
          nomeProduto: 'Leite UHT',
          categoria: 'Laticínios',
          saldoTotal: 10,
          consumoDiarioEstimado: 2,
          diasAutonomia: 5,
          menorValidadeDias: 3,
          riscoVencerAntesDeAcabar: true,
          precisaReposicaoBreve: true,
          prateleiras: ['Geladeira 1'],
        },
      ],
      atalho: { rotulo: 'Abrir Saída', rota: '/stock-remove', icone: 'minus-circle' },
    };

    await rerender(
      <DoraMessageBubble
        mensagem={msgDora}
        ehUltimaMensagem={true}
        coresChat={coresChat}
        onAbrirSobre={onSobre}
        onNavegarAtalho={onAtalho}
        onSelecionarSugestao={onSugestao}
      />
    );

    expect(getByText('Arroz Doce')).toBeTruthy();
    expect(getByText('Risco de vencer')).toBeTruthy();
    await fireEvent.press(getByText('Ver fonte: TudoGostoso'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.tudogostoso.com.br');

    await fireEvent.press(getByText('Abrir Saída'));
    expect(onAtalho).toHaveBeenCalledWith('/stock-remove');

    await fireEvent.press(getByText('🍲 Me sugere uma receita?'));
    expect(onSugestao).toHaveBeenCalledWith('🍲 Me sugere uma receita?');

    await rerender(
      <DoraStructuredText
        texto={'# Título\n## Subtítulo\n• **Item:** Valor\nTexto simples'}
        corBase="#111111"
        coresChat={coresChat}
      />
    );
    expect(getByText('Título')).toBeTruthy();
    expect(getByText('Subtítulo')).toBeTruthy();
  });
});
