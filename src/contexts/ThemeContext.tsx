import React, { createContext, useContext, useState, useEffect } from 'react';
import { MantineColorScheme } from '@mantine/core';

interface ThemeContextType {
  colorScheme: MantineColorScheme;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<MantineColorScheme>(() => {
    const savedTheme = localStorage.getItem('abc-escolar-theme') as MantineColorScheme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('abc-escolar-theme', colorScheme);
  }, [colorScheme]);

  const toggleColorScheme = () => {
    setColorScheme(current => current === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};