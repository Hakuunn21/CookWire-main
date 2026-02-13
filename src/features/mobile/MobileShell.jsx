import {
  Box,
  Button,
  Chip,
  Divider,
  Fab,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import {
  PlayArrowRounded,
  SaveRounded,
  SearchRounded,
  CodeRounded,
  SettingsRounded,
  FolderOpenRounded,
  DarkModeRounded,
  LightModeRounded,
  MoreVertRounded,
  KeyboardCommandKeyRounded,
  FileDownloadRounded,
  BuildRounded,
  DragHandleRounded,
} from '@mui/icons-material'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import MobileConsolePanel from './MobileConsolePanel'
import PreviewPane from '../preview/PreviewPane'

const FILE_KEYS = ['html', 'css', 'js']

const TAB_LABELS = { html: 'HTML', css: 'CSS', js: 'JS' }

const MobileShell = memo(function MobileShell({
  state,
  dispatch,
  t,
  onRegisterEditorRef,
  onOpenSearch,
  onOpenCommands,
  onOpenProjects,
  onOpenSettings,
  onOpenMinitool,
  onSaveLocationOpen,
  onToggleTheme,
  onFormat,
  onRun,
}) {
  const [viewMode, setViewMode] = useState('editor') // 'editor' | 'preview'
  const [menuAnchor, setMenuAnchor] = useState(null)
  const editorRefs = useRef({ html: null, css: null, js: null })

  const consoleOpen = state.workspacePrefs.mobileConsoleOpen ?? false
  const activeFile = state.activeFile
  const activeLines = useMemo(
    () => state.files[activeFile].split('\n').length,
    [state.files, activeFile],
  )

  const registerRef = useCallback(
    (fileKey, node) => {
      editorRefs.current[fileKey] = node
      onRegisterEditorRef(fileKey, node)
    },
    [onRegisterEditorRef],
  )



  const handleTabChange = useCallback((_e, newValue) => {
    if (newValue === 'preview') {
      setViewMode('preview')
    } else {
      setViewMode('editor')
      dispatch({ type: 'SET_ACTIVE_FILE', payload: newValue })
    }
  }, [dispatch])

  // --- Drag-to-resize split removed ---

  const handleMenuOpen = useCallback((e) => setMenuAnchor(e.currentTarget), [])
  const handleMenuClose = useCallback(() => setMenuAnchor(null), [])

  const handleMenuAction = useCallback(
    (action) => {
      handleMenuClose()
      switch (action) {
        case 'search':
          onOpenSearch()
          break
        case 'commands':
          onOpenCommands()
          break
        case 'projects':
          onOpenProjects()
          break
        case 'settings':
          onOpenSettings()
          break
        case 'minitool':
          onOpenMinitool()
          break
        case 'format':
          onFormat(state.activeFile)
          break
        case 'formatAll':
          onFormat('all')
          break
        case 'save':
          onSaveLocationOpen()
          break
        case 'download':
          onSaveLocationOpen()
          break
        default:
          break
      }
    },
    [
      handleMenuClose,
      onFormat,
      onOpenCommands,
      onOpenMinitool,
      onOpenProjects,
      onOpenSearch,
      onOpenSettings,
      onSaveLocationOpen,
      state.activeFile,
    ],
  )

  const handleToggleConsole = useCallback(() => {
    dispatch({ type: 'SET_MOBILE_CONSOLE_OPEN', payload: !consoleOpen })
  }, [consoleOpen, dispatch])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* ── Mobile Header ── */}
      <Paper
        square
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.75,
          minHeight: 52,
          zIndex: 10,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
        })}
      >
        {/* Logo / title */}
        <Typography
          sx={{
            fontSize: 20,
            lineHeight: 1,
            fontWeight: 700,
            fontFamily: '"BIZ UDPGothic", sans-serif',
            mr: 0.5,
            flexShrink: 0,
          }}
        >
          {t('appName')}
        </Typography>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        {/* Editable project title */}
        <Box
          component="input"
          value={state.title}
          onChange={(e) =>
            dispatch({ type: 'SET_TITLE', payload: e.target.value })
          }
          spellCheck={false}
          sx={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'text.secondary',
            fontFamily: '"Google Sans", sans-serif',
            fontSize: 13,
            fontWeight: 500,
            px: 0.5,
            py: 0.25,
            '&:focus': { color: 'text.primary' },
          }}
        />

        {/* Theme toggle */}
        <IconButton size="small" onClick={onToggleTheme} sx={{ p: 0.5 }}>
          {state.themeMode === 'dark' ? (
            <LightModeRounded sx={{ fontSize: 20 }} />
          ) : (
            <DarkModeRounded sx={{ fontSize: 20 }} />
          )}
        </IconButton>

        {/* Save */}
        <IconButton
          size="small"
          onClick={onSaveLocationOpen}
          disabled={state.cloud.saving}
          sx={{ p: 0.5 }}
        >
          <SaveRounded sx={{ fontSize: 20 }} />
        </IconButton>

        {/* More menu */}
        <IconButton size="small" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
          <MoreVertRounded sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Run button - prominent */}
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PlayArrowRounded />}
          onClick={() => {
            onRun()
            setViewMode('preview')
          }}
          sx={{
            minWidth: 0,
            px: 1.5,
            py: 0.5,
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 999,
            flexShrink: 0,
          }}
        >
          {t('run')}
        </Button>
      </Paper>

      {/* ── Editor Tabs ── */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          px: 1,
          minHeight: 40,
          backgroundColor: theme.custom.surfaceContainer,
          flexShrink: 0,
        })}
      >
        <Tabs
          value={viewMode === 'preview' ? 'preview' : activeFile}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={false}
          sx={{
            minHeight: 36,
            '& .MuiTabs-flexContainer': { gap: 0.25 },
          }}
        >
          {FILE_KEYS.map((key) => (
            <Tab
              key={key}
              value={key}
              label={TAB_LABELS[key]}
              disableRipple
              sx={{
                minHeight: 32,
                minWidth: 56,
                px: 1.5,
                py: 0.5,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'none',
              }}
            />
          ))}
          <Tab
            value="preview"
            label={t('preview') || 'Preview'}
            disableRipple
            sx={{
              minHeight: 32,
              minWidth: 56,
              px: 1.5,
              py: 0.5,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'none',
            }}
          />
        </Tabs>

        <Box sx={{ flex: 1 }} />

        {viewMode !== 'preview' && (
          <Chip
            label={`${activeLines} ${t('lines')}`}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              borderRadius: 999,
              '& .MuiChip-label': { px: 1, fontSize: 10, fontWeight: 600 },
            }}
          />
        )}
      </Box>

      {/* ── Main Content Area (Editor OR Preview) ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Editor Panel */}
        <Box
          sx={(theme) => ({
            flex: 1,
            display: viewMode === 'editor' ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: theme.custom.workspaceCanvas,
          })}
        >
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {FILE_KEYS.map((fileKey) => {
              const visible = activeFile === fileKey
              return (
                <Box
                  key={fileKey}
                  role="tabpanel"
                  hidden={!visible}
                  sx={{
                    display: visible ? 'block' : 'none',
                    height: '100%',
                  }}
                >
                  <Box
                    component="textarea"
                    ref={(node) => registerRef(fileKey, node)}
                    aria-label={`${t('ariaEditor')} ${fileKey}`}
                    value={state.files[fileKey]}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_FILE_CONTENT',
                        payload: { file: fileKey, value: e.target.value },
                      })
                    }
                    spellCheck={false}
                    className="editor-textarea"
                    placeholder={
                      fileKey === 'html'
                        ? '<section>...</section>'
                        : fileKey === 'css'
                          ? '.class { ... }'
                          : 'console.log()'
                    }
                    style={{
                      fontFamily: '"Google Sans", monospace',
                      fontSize: `${state.editorPrefs.fontSize}px`,
                      lineHeight: state.editorPrefs.lineHeight,
                      color: 'inherit',
                    }}
                  />
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* Preview Panel */}
        <Box
          sx={(theme) => ({
            flex: 1,
            display: viewMode === 'preview' ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: theme.custom.workspaceCanvas,
          })}
        >
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <PreviewPane
              previewFiles={state.previewFiles}
              language={state.language}
              t={t}
              mobile
            />
          </Box>
        </Box>
      </Box>


      {/* ── Console Panel ── */}
      <MobileConsolePanel
        open={consoleOpen}
        onToggle={handleToggleConsole}
        t={t}
      />

      {/* ── Safe area bottom spacer ── */}
      <Box
        sx={{
          height: 'env(safe-area-inset-bottom)',
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      />

      {/* ── Overflow Menu ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              borderRadius: 3,
              mt: 0.5,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleMenuAction('search')}>
          <ListItemIcon><SearchRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('searchReplace')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('commands')}>
          <ListItemIcon><KeyboardCommandKeyRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('commandPalette')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('format')}>
          <ListItemIcon><CodeRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('formatCurrent')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('formatAll')}>
          <ListItemIcon><CodeRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('formatAll')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('projects')}>
          <ListItemIcon><FolderOpenRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('projects')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('minitool')}>
          <ListItemIcon><BuildRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('minitool')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('settings')}>
          <ListItemIcon><SettingsRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('settings')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('save')}>
          <ListItemIcon><FileDownloadRounded fontSize="small" /></ListItemIcon>
          <ListItemText>{t('saveProject')}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
})

export default MobileShell
