import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { estilosDora } from '../../styles/dora.styles';
import { COMANDOS_VOZ_RAPIDOS, CoresChatDora } from './types';

interface DoraComposerProps {
  entradaTexto: string;
  processandoIa: boolean;
  exibirComandosVoz: boolean;
  coresChat: CoresChatDora;
  onChangeTexto: (texto: string) => void;
  onToggleComandosVoz: () => void;
  onEnviar: (textoManual?: string) => void;
}

export function DoraComposer({
  entradaTexto,
  processandoIa,
  exibirComandosVoz,
  coresChat,
  onChangeTexto,
  onToggleComandosVoz,
  onEnviar,
}: DoraComposerProps) {
  const { theme, tokens, fontScale } = useAppTheme();
  const insets = useSafeAreaInsets();

  const alturaBottomNavBar = 60 + (insets.bottom > 0 ? insets.bottom : 8);
  const podeEnviar = Boolean(entradaTexto.trim()) && !processandoIa;

  return (
    <>
      {exibirComandosVoz && (
        <View
          style={[
            estilosDora.painelVoz,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
          ]}
        >
          <Text
            style={{
              fontWeight: '800',
              color: coresChat.tituloBloco,
              fontSize: 12 * fontScale,
              marginBottom: 8,
            }}
          >
            Toque em uma pergunta pronta ou use o ditado do teclado:
          </Text>
          <View style={estilosDora.gradeVoz}>
            {COMANDOS_VOZ_RAPIDOS.map((cmd) => (
              <TouchableOpacity
                key={cmd}
                onPress={() => onEnviar(cmd)}
                style={[
                  estilosDora.chipVoz,
                  {
                    backgroundColor: coresChat.cardInternoBg,
                    borderColor: coresChat.chipSugestaoBorda,
                  },
                ]}
                accessibilityRole="button"
              >
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 12 * fontScale }}>
                  {cmd}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View
        style={[
          estilosDora.composerDock,
          {
            backgroundColor: coresChat.composerDockBg,
            borderTopColor: theme.border,
            paddingBottom: alturaBottomNavBar,
          },
        ]}
      >
        <View style={estilosDora.composerRow}>
          <View
            style={[
              estilosDora.composerInputBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={onToggleComandosVoz}
              style={estilosDora.botaoMic}
              accessibilityRole="button"
              accessibilityLabel="Alternar sugestões rápidas"
            >
              <Feather
                name="mic"
                size={20}
                color={exibirComandosVoz ? '#10B981' : coresChat.tituloBloco}
              />
            </TouchableOpacity>

            <TextInput
              placeholder="Mensagem para a Dora..."
              placeholderTextColor={theme.subtext}
              value={entradaTexto}
              onChangeText={onChangeTexto}
              onSubmitEditing={() => onEnviar()}
              returnKeyType="send"
              accessibilityLabel="Campo de mensagem para a assistente Dora"
              style={[
                estilosDora.campoDigitacao,
                {
                  color: theme.text,
                  fontSize: tokens.typography.fontSize.sm * fontScale,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            onPress={() => onEnviar()}
            disabled={!podeEnviar}
            style={[
              estilosDora.botaoEnviarCircular,
              {
                backgroundColor: entradaTexto.trim() ? '#10B981' : coresChat.tituloBloco,
                opacity: podeEnviar ? 1 : 0.6,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem para a Dora"
          >
            <Feather name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
