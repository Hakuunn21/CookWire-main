import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListSubheader,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'

function normalizeSliderValue(value, fallback) {
  if (Array.isArray(value)) return value[0] ?? fallback
  return value
}

function SettingItem({ label, description, children, showDivider = true }) {
  return (
    <>
      <ListItem
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 1.25 },
          px: 2,
        }}
      >
        <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 180px' } }}>
          <Typography variant="bodyMedium" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          {description && (
            <Typography variant="bodySmall" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            width: { xs: '100%', sm: 'auto' },
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </ListItem>
      {showDivider && <Divider />}
    </>
  )
}

export default function SettingsView({ open, onClose, state, dispatch, t }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ px: 2, py: 1.5 }}>
        <Typography variant="headlineSmall">{t('settings')}</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <List sx={{ py: 0 }}>
          {/* Appearance Section */}
          <ListSubheader sx={{ px: 2, py: 1, bgcolor: 'background.paper', lineHeight: 1.5 }}>
            <Typography variant="titleSmall" color="primary">
              {t('settingsSectionAppearance')}
            </Typography>
          </ListSubheader>

          <SettingItem label={t('themeMode')} description={t('settingsHintTheme')}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={state.themeMode}
              onChange={(_event, next) => {
                if (next) dispatch({ type: 'SET_THEME_MODE', payload: next })
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.75,
                  textTransform: 'none',
                },
              }}
            >
              <ToggleButton value="dark">{t('themeDark')}</ToggleButton>
              <ToggleButton value="light">{t('themeLight')}</ToggleButton>
            </ToggleButtonGroup>
          </SettingItem>

          <SettingItem label={t('language')} description={t('settingsHintLanguage')}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t('language')}</InputLabel>
              <Select
                label={t('language')}
                value={state.language}
                onChange={(event) =>
                  dispatch({ type: 'SET_LANGUAGE', payload: event.target.value })
                }
              >
                <MenuItem value="en">{t('languageEnglish')}</MenuItem>
                <MenuItem value="ja">{t('languageJapanese')}</MenuItem>
              </Select>
            </FormControl>
          </SettingItem>

          {/* Editor Section */}
          <ListSubheader sx={{ px: 2, py: 1, bgcolor: 'background.paper', lineHeight: 1.5 }}>
            <Typography variant="titleSmall" color="primary">
              {t('settingsSectionEditor')}
            </Typography>
          </ListSubheader>

          <SettingItem label={t('fontSize')} description={t('settingsHintFontSize')}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 320 }}>
              <Slider
                value={state.editorPrefs.fontSize}
                min={12}
                max={20}
                step={1}
                onChange={(_event, value) =>
                  dispatch({
                    type: 'SET_EDITOR_PREF',
                    payload: {
                      fontSize: normalizeSliderValue(value, state.editorPrefs.fontSize),
                    },
                  })
                }
                sx={{ flex: 1 }}
              />
              <Typography variant="bodyMedium" sx={{ minWidth: 42, textAlign: 'right' }}>
                {state.editorPrefs.fontSize}px
              </Typography>
            </Stack>
          </SettingItem>

          <SettingItem label={t('lineHeight')} description={t('settingsHintLineHeight')}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 320 }}>
              <Slider
                value={state.editorPrefs.lineHeight}
                min={1.2}
                max={2.1}
                step={0.05}
                onChange={(_event, value) =>
                  dispatch({
                    type: 'SET_EDITOR_PREF',
                    payload: {
                      lineHeight: normalizeSliderValue(value, state.editorPrefs.lineHeight),
                    },
                  })
                }
                sx={{ flex: 1 }}
              />
              <Typography variant="bodyMedium" sx={{ minWidth: 42, textAlign: 'right' }}>
                {state.editorPrefs.lineHeight.toFixed(2)}
              </Typography>
            </Stack>
          </SettingItem>

          <SettingItem label={t('autoPreview')} description={t('settingsHintAutoPreview')}>
            <Switch
              checked={state.editorPrefs.autoPreview}
              onChange={(event) =>
                dispatch({
                  type: 'SET_EDITOR_PREF',
                  payload: { autoPreview: event.target.checked },
                })
              }
            />
          </SettingItem>

          {/* Preview Section */}
          <ListSubheader sx={{ px: 2, py: 1, bgcolor: 'background.paper', lineHeight: 1.5 }}>
            <Typography variant="titleSmall" color="primary">
              {t('settingsSectionPreview')}
            </Typography>
          </ListSubheader>

          <SettingItem
            label={t('previewMode')}
            description={t('settingsHintPreviewMode')}
            showDivider={false}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={state.workspacePrefs.previewMode}
              onChange={(_event, next) => {
                if (next) dispatch({ type: 'SET_PREVIEW_MODE', payload: next })
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.75,
                  textTransform: 'none',
                },
              }}
            >
              <ToggleButton value="desktop">{t('previewDesktop')}</ToggleButton>
              <ToggleButton value="mobile">{t('previewMobile')}</ToggleButton>
            </ToggleButtonGroup>
          </SettingItem>
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="text">
          {t('close')}
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          {t('done')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
