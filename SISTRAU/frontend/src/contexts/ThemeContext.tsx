import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';

interface ThemeContextType {
  mode: 'dark';
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const CustomThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always use dark mode for the futuristic theme
  const mode = 'dark' as const;

  useEffect(() => {
    // Apply dark background to the root element
    document.documentElement.style.backgroundColor = '#0A0A0F';
  }, []);

  const toggleColorMode = () => {
    // No-op since we're forcing dark mode
    console.log('Theme is locked to dark mode for futuristic design');
  };

  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    []
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default CustomThemeProvider;