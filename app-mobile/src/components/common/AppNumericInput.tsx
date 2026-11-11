import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

export interface AppNumericInputProps {
  rotulo?: string;
  value: string;
  onChangeText: (novoValor: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  mensagemAviso?: string;
  dicaAcessibilidade?: string;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Campo numérico padronizado com botões de decremento (-1) à esquerda e
 * incremento (+1) à direita, respeitando área mínima de toque de 48px.
 */
export function AppNumericInput({
  rotulo,
  value,
  onChangeText,
  placeholder = '0',
  min = 0,
  max,
  step = 1,
  mensagemAviso,
  dicaAcessibilidade,
  editable = true,
  containerStyle,
}: AppNumericInputProps) {
  const { theme, tokens, fontScale } = useAppTheme();

  const limparParaInteiro = (texto: string): string => {
    return (texto || '').replace(/\D/g, '');
  };

  const valorAtual = value.trim() === '' ? 0 : parseInt(limparParaInteiro(value) || '0', 10);

  const aplicarNovoNumero = (candidato: number) => {
    let ajustado = candidato;
    if (typeof min === 'number' && ajustado < min) ajustado = min;
    if (typeof max === 'number' && ajustado > max) ajustado = max;
    onChangeText(String(ajustado));
  };

  const lidarComDigitacao = (texto: string) => {
    const digitos = limparParaInteiro(texto);
    if (digitos === '') {
      onChangeText('');
      return;
    }
    const numero = parseInt(digitos, 10);
    if (isNaN(numero)) return;
    if (typeof max === 'number' && numero > max) {
      onChangeText(String(max));
      return;
    }
    onChangeText(String(numero));
  };

  const podeDecrementar = editable && (value.trim() !== '' ? valorAtual > min : min < 0);
  const podeIncrementar = editable && (typeof max !== 'number' || valorAtual < max);

  return (
    <View style={[styles.container, containerStyle]}>
      {rotulo ? (
        <Text
          style={[
            styles.label,
            {
              color: theme.text,
              fontSize: tokens.typography.fontSize.sm * fontScale,
            },
          ]}
        >
          {rotulo}
        </Text>
      ) : null}

      <View
        style={[
          styles.stepperRow,
          {
            backgroundColor: theme.surface,
            borderColor: mensagemAviso ? theme.danger : theme.border,
            opacity: editable ? 1 : 0.6,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.stepButton,
            styles.leftButton,
            {
              backgroundColor: podeDecrementar ? `${theme.primary}12` : theme.background,
              borderRightColor: theme.border,
            },
          ]}
          onPress={() => aplicarNovoNumero(valorAtual - step)}
          disabled={!podeDecrementar}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={
            rotulo ? `Diminuir 1 em ${rotulo}` : 'Diminuir 1'
          }
          accessibilityState={{ disabled: !podeDecrementar }}
        >
          <Feather
            name="minus"
            size={14}
            color={podeDecrementar ? theme.primary : theme.subtext}
          />
          <Text
            style={[
              styles.stepText,
              {
                color: podeDecrementar ? theme.primary : theme.subtext,
                fontSize: 13 * fontScale,
              },
            ]}
          >
            -1
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              fontSize: tokens.typography.fontSize.md * fontScale,
            },
          ]}
          value={value}
          onChangeText={lidarComDigitacao}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext}
          keyboardType="numeric"
          editable={editable}
          textAlign="center"
          accessibilityLabel={rotulo || 'Campo numérico'}
          accessibilityHint={
            dicaAcessibilidade || 'Digite um número ou utilize os botões -1 e +1'
          }
        />

        <TouchableOpacity
          style={[
            styles.stepButton,
            styles.rightButton,
            {
              backgroundColor: podeIncrementar ? `${theme.secondary}16` : theme.background,
              borderLeftColor: theme.border,
            },
          ]}
          onPress={() => aplicarNovoNumero(valorAtual + step)}
          disabled={!podeIncrementar}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={
            rotulo ? `Aumentar 1 em ${rotulo}` : 'Aumentar 1'
          }
          accessibilityState={{ disabled: !podeIncrementar }}
        >
          <Feather
            name="plus"
            size={14}
            color={podeIncrementar ? theme.secondary : theme.subtext}
          />
          <Text
            style={[
              styles.stepText,
              {
                color: podeIncrementar ? theme.secondary : theme.subtext,
                fontSize: 13 * fontScale,
              },
            ]}
          >
            +1
          </Text>
        </TouchableOpacity>
      </View>

      {mensagemAviso ? (
        <Text
          style={[
            styles.aviso,
            { color: theme.danger, fontSize: tokens.typography.fontSize.xs * fontScale },
          ]}
        >
          {mensagemAviso}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepButton: {
    minWidth: 52,
    minHeight: 48,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  leftButton: {
    borderRightWidth: 1,
  },
  rightButton: {
    borderLeftWidth: 1,
  },
  stepText: {
    fontWeight: '800',
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 10,
    fontWeight: '700',
  },
  aviso: {
    marginTop: 6,
    fontWeight: '600',
  },
});
