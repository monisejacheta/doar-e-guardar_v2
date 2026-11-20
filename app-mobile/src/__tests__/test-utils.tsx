import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '../context/ThemeContext';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

export function renderWithTheme(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
