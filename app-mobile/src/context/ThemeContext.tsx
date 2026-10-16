// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { lightTheme, darkTheme, highContrastTheme, ThemeColors } from '../theme/themes';
import { tokens } from '../theme/tokens';

type ThemeMode = 'light' | 'dark' | 'high-contrast';

interface ThemeContextData {
  theme: ThemeColors;
  tokens: typeof tokens;
  mode: ThemeMode;
  fontScale: number;
  setMode: (mode: ThemeMode) => void;
  setFontScale: (scale: number) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [fontScale, setFontScale] = useState<number>(1.0); // 1.0 (normal) a 1.5/2.0 (redimensionamento acessível)[cite: 3]

  const theme = useMemo(() => {
    switch (mode) {
      case 'dark':
        return darkTheme;
      case 'high-contrast':
        return highContrastTheme;
      default:
        return lightTheme;
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme, tokens, mode, fontScale, setMode, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);