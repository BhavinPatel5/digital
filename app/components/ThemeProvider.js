// theme-provider.js

'use client';

import { createContext, useContext, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the SkyThemeProvider to make it SSR-friendly
const SkyThemeProvider = dynamic(
  () => import('@sky-ui/react').then((mod) => mod.SkyThemeProvider),
  { ssr: false } // This makes sure the component is only loaded on the client side
);

// Create a ThemeContext to share the theme state
const ThemeContext = createContext(null);

// Create the ThemeProvider component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light'); // Default theme is 'light'

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Optionally, persist the theme in localStorage
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {/* The SkyThemeProvider is only rendered on the client-side */}
      <SkyThemeProvider preference={theme}>
        {children}
      </SkyThemeProvider>
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context in components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
