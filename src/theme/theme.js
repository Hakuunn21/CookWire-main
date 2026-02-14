import { alpha, createTheme } from '@mui/material/styles'

const TOKENS = {
  dark: {
    primary: '#a8c7ff', // M3 Dark Primary (light blue)
    onPrimary: '#003062',
    primaryContainer: '#00468a',
    onPrimaryContainer: '#d6e3ff',
    secondary: '#bec6dc',
    onSecondary: '#283141',
    secondaryContainer: '#3e4759',
    onSecondaryContainer: '#dae2f9',
    background: '#1a1c1e',
    surface: '#1a1c1e',
    surfaceVariant: '#44474e',
    onSurface: '#e2e2e6',
    onSurfaceVariant: '#c4c6d0',
    outline: '#8e9099',
    workspaceCanvas: '#111318',
    mainDisplay: '#1a1c1e',
  },
  light: {
    primary: '#005faf', // M3 Light Primary
    onPrimary: '#ffffff',
    primaryContainer: '#d6e3ff',
    onPrimaryContainer: '#001b3e',
    secondary: '#565e71',
    onSecondary: '#ffffff',
    secondaryContainer: '#dae2f9',
    onSecondaryContainer: '#131c2b',
    background: '#fdfcff',
    surface: '#fdfcff',
    surfaceVariant: '#e0e2ec',
    onSurface: '#1a1c1e',
    onSurfaceVariant: '#44474e',
    outline: '#74777f',
    workspaceCanvas: '#f1f0f4',
    mainDisplay: '#fdfcff',
  },
}

const flatShadows = Array.from({ length: 25 }, () => 'none')

export const createAppTheme = (mode = 'dark') => {
  const c = mode === 'light' ? TOKENS.light : TOKENS.dark
  const navIndicator = alpha(c.primary, 0.12)

  return createTheme({
    cssVariables: true,
    shape: {
      borderRadius: 12, // M3 Medium components
    },
    shadows: flatShadows,
    typography: {
      fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      displayLarge: { fontWeight: 400, fontSize: 57, lineHeight: 1.12, letterSpacing: -0.25 },
      displayMedium: { fontWeight: 400, fontSize: 45, lineHeight: 1.15 },
      displaySmall: { fontWeight: 400, fontSize: 36, lineHeight: 1.22 },
      headlineLarge: { fontWeight: 400, fontSize: 32, lineHeight: 1.25 },
      headlineMedium: { fontWeight: 400, fontSize: 28, lineHeight: 1.29 },
      headlineSmall: { fontWeight: 400, fontSize: 24, lineHeight: 1.33 },
      titleLarge: { fontWeight: 400, fontSize: 22, lineHeight: 1.25 },
      titleMedium: { fontWeight: 500, fontSize: 16, lineHeight: 1.5, letterSpacing: 0.15 },
      titleSmall: { fontWeight: 500, fontSize: 14, lineHeight: 1.43, letterSpacing: 0.1 },
      bodyLarge: { fontWeight: 400, fontSize: 16, lineHeight: 1.5, letterSpacing: 0.5 },
      bodyMedium: { fontWeight: 400, fontSize: 14, lineHeight: 1.43, letterSpacing: 0.25 },
      bodySmall: { fontWeight: 400, fontSize: 12, lineHeight: 1.33, letterSpacing: 0.4 },
      labelLarge: { fontWeight: 500, fontSize: 14, lineHeight: 1.43, letterSpacing: 0.1 },
      labelMedium: { fontWeight: 500, fontSize: 12, lineHeight: 1.33, letterSpacing: 0.5 },
      labelSmall: { fontWeight: 500, fontSize: 11, lineHeight: 1.45, letterSpacing: 0.5 },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    palette: {
      mode,
      primary: {
        main: c.primary,
        contrastText: c.onPrimary,
      },
      secondary: {
        main: c.secondary,
        contrastText: c.onSecondary,
      },
      background: {
        default: c.background,
        paper: c.surface,
      },
      text: {
        primary: c.onSurface,
        secondary: c.onSurfaceVariant,
      },
      divider: alpha(c.outline, 0.2),
    },
    custom: {
      surfaceContainer: c.background,
      surfaceContainerHigh: c.surfaceVariant,
      workspaceCanvas: c.workspaceCanvas,
      mainDisplay: c.mainDisplay,
      navIndicator,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            backgroundColor: c.background,
            color: c.onSurface,
          },
        },
      },
      MuiListSubheader: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            color: c.onSurfaceVariant,
            fontWeight: 700,
            lineHeight: '48px',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 999, // M3 Buttons are pill-shaped
            minHeight: 40,
            paddingInline: 24,
            '&:hover': {
              backgroundColor: alpha(c.primary, 0.08),
            },
          },
          containedPrimary: {
            backgroundColor: c.primary,
            color: c.onPrimary,
            '&:hover': {
              backgroundColor: mode === 'light' ? alpha(c.primary, 0.9) : alpha(c.primary, 0.8),
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            },
          },
          text: {
            paddingInline: 12,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '50%',
            '&:hover': {
              backgroundColor: alpha(c.onSurface, 0.08),
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28, // M3 Dialogs have 28dp corner radius
            backgroundColor: c.surface,
            padding: 24,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4, // M3 Outlined fields have small corner radius
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            marginInline: 4,
            marginBlock: 4,
            '&.Mui-selected': {
              backgroundColor: c.secondaryContainer,
              color: c.onSecondaryContainer,
              '&:hover': {
                backgroundColor: alpha(c.secondaryContainer, 0.8),
              },
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16, // M3 FABs are rounded squares
          },
        },
      },
    },
  })
}
