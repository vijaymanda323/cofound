import React, { createContext, useContext } from 'react';

// Theme Context
const ThemeContext = createContext();

// Theme colors (Light Mode Only)
const colors = {
  // Background colors
  appBackground: '#F7F7F7',
  cardBackground: '#EFE9E1',
  white: '#FFFFFF',
  
  // Text colors
  primaryText: '#4A4A4A',
  secondaryText: '#7A7A7A',
  textWhite: '#ffffff',
  
  // CTA colors
  ctaButton: '#1155ccff',
  ctaText: '#ffffff',
  
  // Status colors
  success: '#00b000',
  error: '#ff4444',
  warning: '#ffaa00',
  info: '#1155ccff',
  
  // Border colors
  border: '#D4D4D4',
  lightBorder: '#E5E5E5',
  
  // Online status
  onlineGreen: '#00b000',
  offlineGrey: '#b7b7b7',
};

// Typography
const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  body: {
    fontSize: 16,
    color: colors.primaryText,
  },
  caption: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  small: {
    fontSize: 12,
    color: colors.secondaryText,
  },
};

// Spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

// Shadow
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Theme Provider
export const ThemeProvider = ({ children }) => {
  const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeContext };
