import { alpha, createTheme } from '@mui/material/styles'

const TOKENS = {
  dark: {
    primary: '#17222d',
    onPrimary: '#e7edf7',
    primaryContainer: '#17222d',
    onPrimaryContainer: '#e7edf7',
    background: '#17222d',
    surface: '#17222d',
    surfaceContainer: '#17222d',
    surfaceContainerHigh: '#17222d',
    workspaceCanvas: '#121d28',
    mainDisplay: '#0f1822',
    onSurface: '#e7edf7',
    onSurfaceVariant: '#a7b4c8',
    outline: '#3c4c61',
  },
  light: {
    primary: '#1a73e8',
    onPrimary: '#ffffff',
    primaryContainer: '#d3e3fd',
    onPrimaryContainer: '#001a41',
    background: '#edf2f6',
    surface: '#edf2f6',
    surfaceContainer: '#edf2f6',
    surfaceContainerHigh: '#edf2f6',
    workspaceCanvas: '#fafaf8',
    mainDisplay: '#dfe5eb',
    onSurface: '#1b2430',
    onSurfaceVariant: '#556577',
    outline: '#738395',
  },
}

const flatShadows = Array.from({ length: 25 }, () => 'none')

export const createAppTheme = (mode = 'dark') => {
  const c = mode === 'light' ? TOKENS.light : TOKENS.dark
  const navIndicator = 'transparent'

  return createTheme({
    cssVariables: true,
    shape: {
      borderRadius: 4,
    },
    shadows: flatShadows,
    typography: {
      fontFamily: '"Google Sans", sans-serif',
      titleLarge: { fontWeight: 700, fontSize: 22, lineHeight: 1.25 },
      titleMedium: { fontWeight: 650, fontSize: 16, lineHeight: 1.35 },
      bodyLarge: { fontWeight: 500, fontSize: 15, lineHeight: 1.55 },
      labelLarge: { fontWeight: 650, fontSize: 14, lineHeight: 1.4 },
      labelMedium: { fontWeight: 600, fontSize: 12, lineHeight: 1.35 },
      labelSmall: { fontWeight: 600, fontSize: 11, lineHeight: 1.3 },
      button: {
        textTransform: 'none',
        fontWeight: 700,
      },
    },
    palette: {
      mode,
      primary: {
        main: c.primary,
        contrastText: c.onPrimary,
      },
      background: {
        default: c.background,
        paper: c.surface,
      },
      text: {
        primary: c.onSurface,
        secondary: c.onSurfaceVariant,
      },
      divider: alpha(c.outline, 0.25),
    },
    custom: {
      surfaceContainer: c.surfaceContainer,
      surfaceContainerHigh: c.surfaceContainerHigh,
      workspaceCanvas: c.workspaceCanvas,
      mainDisplay: c.mainDisplay,
      navIndicator,
    },
    transitions: {
      duration: {
        shortest: 100,
        shorter: 140,
        short: 180,
        standard: 220,
        complex: 320,
      },
      easing: {
        easeOut: 'cubic-bezier(0.2, 0, 0, 1)',
        easeInOut: 'cubic-bezier(0.2, 0, 0, 1)',
        easeIn: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        sharp: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            backgroundColor: c.background,
            color: c.onSurface,
          },
          '*': {
            boxSizing: 'border-box',
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: c.surface,
            color: c.onSurface,
            boxShadow: 'none',
            backdropFilter: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: c.surfaceContainer,
            boxShadow: 'none',
            border: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 7,
            backgroundColor: c.surface,
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${alpha(c.primary, 0.7)}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 999,
            minHeight: 40,
            paddingInline: 16,
          },
          containedPrimary: {
            backgroundColor: c.primary,
            color: c.onPrimary,
            '&:hover': {
              backgroundColor: mode === 'light' ? '#1557b0' : alpha(c.primary, 0.9),
            },
          },
          contained: {
            backgroundColor: c.surface,
            color: c.onSurface,
            '&:hover': {
              backgroundColor: alpha(c.onSurface, 0.05),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: alpha(c.onSurface, 0.08),
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            '&:hover': {
              backgroundColor: alpha(c.onSurface, 0.08),
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 3,
            backgroundColor: c.surfaceContainerHigh,
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: alpha(c.onSurface, 0.18),
            },
            '&.Mui-focused fieldset': {
              borderColor: c.primary,
              borderWidth: 1,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            display: 'none',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 36,
            paddingInline: 14,
            borderRadius: 10,
            color: c.onSurfaceVariant,
            transition: 'background-color 160ms ease, color 160ms ease',
            '&.Mui-selected': {
              backgroundColor: alpha(c.onSurface, 0.10),
              color: c.onSurface,
              fontWeight: 700,
            },
            '&:hover': {
              backgroundColor: alpha(c.onSurface, 0.05),
            },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            border: 'none',
            borderRadius: 10,
            backgroundColor: alpha(c.onSurface, 0.04),
            padding: 3,
            gap: 2,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            border: 'none',
            borderRadius: '8px !important',
            color: c.onSurfaceVariant,
            transition: 'background-color 160ms ease, color 160ms ease',
            '&.Mui-selected': {
              backgroundColor: alpha(c.onSurface, 0.10),
              color: c.onSurface,
              fontWeight: 700,
            },
            '&.Mui-selected:hover': {
              backgroundColor: alpha(c.onSurface, 0.14),
            },
            '&:hover': {
              backgroundColor: alpha(c.onSurface, 0.05),
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            minHeight: 48,
            '&:hover': {
              backgroundColor: alpha(c.onSurface, 0.06),
            },
            '&.Mui-selected': {
              backgroundColor: alpha(c.onSurface, 0.10),
              color: c.onSurface,
              fontWeight: 700,
            },
            '&.Mui-selected:hover': {
              backgroundColor: alpha(c.onSurface, 0.14),
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: c.surface,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            minWidth: 72,
            borderRadius: 10,
            '&.Mui-selected': {
              color: c.onSurface,
            },
          },
          label: {
            fontWeight: 600,
          },
        },
      },
    },
  })
}
