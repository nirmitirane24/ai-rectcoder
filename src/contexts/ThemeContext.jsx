import React, { createContext, useState, useMemo, useContext } from 'react';

const ThemeContext = createContext({
  themeMode: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('dark'); // Default to light

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Apply theme class to body
  React.useEffect(() => {
    document.body.className = themeMode; // Set class 'light' or 'dark'
  }, [themeMode]);

  const value = useMemo(() => ({ themeMode, toggleTheme }), [themeMode]);

  return (
    <ThemeContext.Provider value={value}>
        {children}
    </ThemeContext.Provider>
  );
};