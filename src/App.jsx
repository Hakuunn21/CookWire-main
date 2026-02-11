import { CssBaseline, ThemeProvider } from '@mui/material'
import { useMemo } from 'react'
import AppShell from './app/AppShell'
import { WorkspaceProvider, useWorkspaceState } from './state/WorkspaceContext'
import { createAppTheme } from './theme/theme'

function ThemedApp() {
  const state = useWorkspaceState()
  const theme = useMemo(() => createAppTheme(state.themeMode), [state.themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell />
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <WorkspaceProvider>
      <ThemedApp />
    </WorkspaceProvider>
  )
}
