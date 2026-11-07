// src/components/common/AppInput.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface AppInputProps extends TextInputProps {
  rotulo: string;
  dicaAcessibilidade?: string;
  mensagemAviso?: string;
  eSenha?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  rotulo,
  dicaAcessibilidade,
  mensagemAviso,
  eSenha = false,
  style,
  ...restoDasPropriedades
}) => {
  const { theme, tokens, fontScale } = useAppTheme();
  const [mostrarTexto, setMostrarTexto] = useState(!eSenha);

  return (
    <View style={estilos.caixaCompleta}>
      {/* Rótulo visível e claro acima do campo */}
      <Text
        style={[
          estilos.rotulo,
          {
            color: theme.text,
            fontSize: tokens.typography.fontSize.sm * fontScale,
          },
        ]}
      >
        {rotulo}
      </Text>

      <View
        style={[
          estilos.areaCampo,
          {
            backgroundColor: theme.surface,
            borderColor: mensagemAviso ? theme.danger : theme.border,
            minHeight: tokens.touchTarget.minHeight,
            borderRadius: tokens.touchTarget.borderRadius,
          },
        ]}
      >
        <TextInput
          {...restoDasPropriedades}
          secureTextEntry={eSenha && !mostrarTexto}
          accessible={true}
          accessibilityLabel={rotulo}
          accessibilityHint={dicaAcessibilidade}
          placeholderTextColor={theme.subtext}
          style={[
            estilos.campoDigitacao,
            {
              color: theme.text,
              fontSize: tokens.typography.fontSize.md * fontScale,
            },
            style,
          ]}
        />

        {/* Botão de alternar visualização de senha se for campo de senha */}
        {eSenha && (
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={mostrarTexto ? 'Ocultar a senha digitada' : 'Mostrar a senha digitada em texto'}
            onPress={() => setMostrarTexto(!mostrarTexto)}
            style={estilos.botaoRevelar}
          >
            <Text style={[estilos.textoRevelar, { color: theme.primary, fontSize: 13 * fontScale }]}>
              {mostrarTexto ? 'Ocultar' : 'Mostrar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mensagem explicativa caso falte preencher algo */}
      {mensagemAviso ? (
        <Text
          style={[
            estilos.textoAviso,
            {
              color: theme.danger,
              fontSize: tokens.typography.fontSize.xs * fontScale,
            },
          ]}
        >
          {mensagemAviso}
        </Text>
      ) : null}
    </View>
  );
};

const estilos = StyleSheet.create({
  caixaCompleta: {
    width: '100%',
    marginBottom: 16,
  },
  rotulo: {
    fontWeight: '600',
    marginBottom: 6,
  },
  areaCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  campoDigitacao: {
    flex: 1,
    paddingVertical: 10,
  },
  botaoRevelar: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  textoRevelar: {
    fontWeight: 'bold',
  },
  textoAviso: {
    marginTop: 4,
    fontWeight: '500',
  },
});