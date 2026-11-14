import React from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { estilosDora } from '../../styles/dora.styles';
import { CoresChatDora } from './types';

interface DoraStructuredTextProps {
  texto: string;
  corBase: string;
  coresChat: CoresChatDora;
}

const renderizarTrechosNegrito = (texto: string, corTexto: string) => {
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  return partes.map((trecho, idx) => {
    if (trecho.startsWith('**') && trecho.endsWith('**')) {
      return (
        <Text key={idx} style={{ fontWeight: '800', color: corTexto }}>
          {trecho.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={idx} style={{ color: corTexto }}>
        {trecho}
      </Text>
    );
  });
};

/**
 * Renderiza títulos (#), subtítulos (##) e tópicos em bullet points (• / -)
 * garantindo leitura escaneável estilo mensageria sem blocos de texto corrido.
 */
export function DoraStructuredText({ texto, corBase, coresChat }: DoraStructuredTextProps) {
  const { tokens, fontScale } = useAppTheme();
  const linhas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <View style={{ gap: 2 }}>
      {linhas.map((linha, idx) => {
        if (linha.startsWith('# ')) {
          return (
            <Text
              key={idx}
              style={[
                estilosDora.tituloBloco,
                {
                  color: coresChat.tituloBloco,
                  fontSize: 15 * fontScale,
                },
              ]}
            >
              {linha.slice(2)}
            </Text>
          );
        }

        if (linha.startsWith('## ')) {
          return (
            <Text
              key={idx}
              style={[
                estilosDora.subtituloBloco,
                {
                  color: coresChat.subtituloBloco,
                  fontSize: 12.5 * fontScale,
                },
              ]}
            >
              {linha.slice(3)}
            </Text>
          );
        }

        const ehBullet = linha.startsWith('• ') || linha.startsWith('- ');
        if (ehBullet) {
          return (
            <View key={idx} style={estilosDora.linhaTopico}>
              <View style={[estilosDora.marcadorTopico, { backgroundColor: '#10B981' }]} />
              <Text
                style={[
                  estilosDora.textoMensagem,
                  {
                    flex: 1,
                    color: corBase,
                    fontSize: tokens.typography.fontSize.sm * fontScale,
                  },
                ]}
              >
                {renderizarTrechosNegrito(linha.slice(2), corBase)}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={idx}
            style={[
              estilosDora.textoMensagem,
              {
                color: corBase,
                fontSize: tokens.typography.fontSize.sm * fontScale,
              },
            ]}
          >
            {renderizarTrechosNegrito(linha, corBase)}
          </Text>
        );
      })}
    </View>
  );
}
