import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider, useAppTheme } from '../../context/ThemeContext';

function ConsumerSample() {
  const { theme, mode, fontScale, setMode, setFontScale } = useAppTheme();
  return (
    <View>
      <Text testID="mode-label">{mode}</Text>
      <Text testID="bg-label">{theme.background}</Text>
      <Text testID="scale-label">{String(fontScale)}</Text>
      <TouchableOpacity testID="btn-dark" onPress={() => setMode('dark')} />
      <TouchableOpacity testID="btn-hc" onPress={() => setMode('high-contrast')} />
      <TouchableOpacity testID="btn-scale" onPress={() => setFontScale(1.5)} />
    </View>
  );
}

describe('context/ThemeContext.tsx', () => {
  it('deve alternar modos de tema e escala de fonte', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ConsumerSample />
      </ThemeProvider>
    );

    expect(getByTestId('mode-label').props.children).toBe('light');
    expect(getByTestId('bg-label').props.children).toBe('#FFFFFF');
    expect(getByTestId('scale-label').props.children).toBe('1');

    await fireEvent.press(getByTestId('btn-dark'));
    expect(getByTestId('mode-label').props.children).toBe('dark');
    expect(getByTestId('bg-label').props.children).toBe('#0F172A');

    await fireEvent.press(getByTestId('btn-hc'));
    expect(getByTestId('mode-label').props.children).toBe('high-contrast');
    expect(getByTestId('bg-label').props.children).toBe('#000000');

    await fireEvent.press(getByTestId('btn-scale'));
    expect(getByTestId('scale-label').props.children).toBe('1.5');
  });
});
