import {
  DarkMode,
  KeyboardCommandKey,
  LightMode,
  Preview,
  Save,
  Search,
  ViewSidebar,
  Code,
} from '@mui/icons-material'
import {
  Box,
  Dialog,
  DialogContent,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import { useMemo, useState } from 'react'

const iconMap = {
  command: KeyboardCommandKey,
  search: Search,
  save: Save,
  project: ViewSidebar,
  preview: Preview,
  dark: DarkMode,
  light: LightMode,
  code: Code,
}

function ShortcutKey({ children }) {
  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        px: 0.75,
        borderRadius: 0.5,
        backgroundColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.common.white, 0.1) 
          : alpha(theme.palette.common.black, 0.05),
        border: `1px solid ${theme.palette.divider}`,
        fontSize: '10px',
        fontWeight: 700,
        fontFamily: 'monospace',
        color: theme.palette.text.secondary,
      })}
    >
      {children}
    </Box>
  )
}

function ShortcutDisplay({ shortcut }) {
  if (!shortcut) return null

  // Format: "Cmd/Ctrl+Shift+F" -> ["Cmd", "Shift", "F"]
  const parts = shortcut.split('+').map(p => p.trim())
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
      {parts.map((part, i) => {
        const isMod = part.toLowerCase().includes('cmd') || part.toLowerCase().includes('ctrl')
        const displayPart = isMod ? (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl') : part
        
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ShortcutKey>{displayPart}</ShortcutKey>
            {i < parts.length - 1 && (
              <Typography variant="caption" sx={{ opacity: 0.5 }}>+</Typography>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default function CommandPalette({ open, onClose, commands, t }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return commands
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(normalized))
  }, [commands, query])

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.2)' }
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: 'none',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            autoFocus
            variant="standard"
            placeholder={t('commandInputPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'primary.main', mr: 1 }} />
                </InputAdornment>
              ),
              sx: { fontSize: '1.1rem', py: 0.5 }
            }}
          />
        </Box>

        <List sx={{ maxHeight: 400, overflowY: 'auto', p: 1 }}>
          {filtered.map((cmd) => {
            const Icon = iconMap[cmd.icon] || KeyboardCommandKey
            return (
              <ListItemButton
                key={cmd.id}
                onClick={() => {
                  cmd.run()
                  onClose()
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.25,
                  px: 2,
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  }
                }}
              >
                <Icon sx={{ fontSize: 20, color: 'text.secondary', mr: 2 }} />
                <ListItemText 
                  primary={cmd.label} 
                  primaryTypographyProps={{ 
                    variant: 'bodyMedium',
                    fontWeight: 500
                  }} 
                />
                <ShortcutDisplay shortcut={cmd.shortcut} />
              </ListItemButton>
            )
          })}
          {filtered.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="bodyMedium" color="text.secondary">
                {t('noMatches')}
              </Typography>
            </Box>
          ) : null}
        </List>
      </DialogContent>
    </Dialog>
  )
}
