/**
 * Design System MODL
 * Direction artistique épurée et professionnelle : Noir, Blanc, Beige/Crème
 */

export const designSystem = {
  colors: {
    // Palette principale - Noir et Blanc
    primary: {
      black: '#000000',
      '900': '#1a1a1a',
      '800': '#2d2d2d',
      '700': '#404040',
      '600': '#525252',
      '500': '#737373',
    },
    // Beige / Crème
    beige: {
      '50': '#faf9f7',
      '100': '#f5f3f0',
      '200': '#eae8e3',
      '300': '#d4d0c7',
      '400': '#b8b3a8',
      '500': '#9c9689',
      '600': '#80796c',
      '700': '#645d52',
      '800': '#484238',
      '900': '#2c261e',
    },
    // Neutres
    neutral: {
      white: '#ffffff',
      '50': '#fafafa',
      '100': '#f5f5f5',
      '200': '#e5e5e5',
      '300': '#d4d4d4',
      '400': '#a3a3a3',
      '500': '#737373',
      '600': '#525252',
      '700': '#404040',
      '800': '#262626',
      '900': '#171717',
      black: '#000000',
    },
    // Backgrounds
    background: {
      default: '#faf9f7', // Beige très clair
      card: '#ffffff',
      hover: '#f5f3f0',
      subtle: '#fafafa',
    },
    // États
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
};
