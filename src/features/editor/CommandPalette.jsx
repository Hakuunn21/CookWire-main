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
  DialogTitle,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
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

export default function CommandPalette({ open, onClose, commands, t }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return commands
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(normalized))
  }, [commands, query])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardCommandKey fontSize="small" />
        {t('commandPalette')}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          placeholder={t('commandInputPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <List sx={{ mt: 1, p: 0.5 }}>
          {filtered.map((cmd) => {
            const Icon = iconMap[cmd.icon] || KeyboardCommandKey
            return (
              <ListItemButton
                key={cmd.id}
                onClick={() => {
                  cmd.run()
                  onClose()
                }}
                sx={{ mb: 0.5 }}
              >
                <Icon fontSize="small" />
                <ListItemText primary={cmd.label} sx={{ ml: 1 }} />
                {cmd.shortcut ? (
                  <Typography variant="labelSmall" color="text.secondary">
                    {cmd.shortcut}
                  </Typography>
                ) : null}
              </ListItemButton>
            )
          })}
          {filtered.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('noMatches')}
              </Typography>
            </Box>
          ) : null}
        </List>
      </DialogContent>
    </Dialog>
  )
}
