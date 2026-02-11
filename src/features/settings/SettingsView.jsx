import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material'

export default function SettingsView({ open, onClose, state, dispatch, t }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('settings')}</DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="labelLarge">{t('language')}</Typography>
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <Select
                value={state.language}
                onChange={(event) => dispatch({ type: 'SET_LANGUAGE', payload: event.target.value })}
              >
                <MenuItem value="en">{t('languageEnglish')}</MenuItem>
                <MenuItem value="ja">{t('languageJapanese')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="labelLarge">{t('fontSize')}</Typography>
            <Slider
              value={state.editorPrefs.fontSize}
              min={12}
              max={20}
              step={1}
              valueLabelDisplay="auto"
              onChange={(_event, value) => dispatch({ type: 'SET_EDITOR_PREF', payload: { fontSize: value } })}
            />
          </Box>

          <Box>
            <Typography variant="labelLarge">{t('lineHeight')}</Typography>
            <Slider
              value={state.editorPrefs.lineHeight}
              min={1.2}
              max={2.1}
              step={0.05}
              valueLabelDisplay="auto"
              onChange={(_event, value) => dispatch({ type: 'SET_EDITOR_PREF', payload: { lineHeight: value } })}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={state.editorPrefs.autoPreview}
                onChange={(event) => dispatch({ type: 'SET_EDITOR_PREF', payload: { autoPreview: event.target.checked } })}
              />
            }
            label={t('autoPreview')}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>{t('close')}</Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
