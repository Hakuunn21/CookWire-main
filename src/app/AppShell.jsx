import {
  BuildRounded,
  DarkModeRounded,
  FolderOpenRounded,
  KeyboardCommandKeyRounded,
  LightModeRounded,
  PlayArrowRounded,
  SaveRounded,
  SearchRounded,
  SettingsRounded,
  TerminalRounded,
} from '@mui/icons-material'
import {
  Alert,
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CommandPalette from '../features/editor/CommandPalette'
import EditorPane from '../features/editor/EditorPane'
import EditorWorkspace from '../features/editor/EditorWorkspace'
import SearchReplacePanel from '../features/editor/SearchReplacePanel'
import PreviewPane from '../features/preview/PreviewPane'
import ProjectBrowser from '../features/project/ProjectBrowser'
import SettingsView from '../features/settings/SettingsView'
import MinitoolView from '../features/minitool/MinitoolView'
import { tFor } from '../i18n'
import { useWorkspaceDispatch, useWorkspaceState } from '../state/WorkspaceContext'
import { formatSource } from '../utils/formatCode'
import { getOwnerKey } from '../utils/ownerKey'
import { createProject, getProject, listProjects, updateProject } from '../utils/projectApi'

const LOCAL_STATE_KEY = 'cookwire-workspace-v3'

const commentMarkers = {
  html: { prefix: '<!-- ', suffix: ' -->' },
  css: { prefix: '/* ', suffix: ' */' },
  js: { prefix: '// ', suffix: '' },
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function computeMatches(content, query, caseSensitive) {
  if (!query) return []
  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(escapeRegExp(query), flags)
  const matches = []
  let match = regex.exec(content)
  while (match) {
    matches.push({ index: match.index, length: match[0].length })
    match = regex.exec(content)
  }
  return matches
}

function replaceAt(content, start, end, value) {
  return `${content.slice(0, start)}${value}${content.slice(end)}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function AppShell() {
  const state = useWorkspaceState()
  const dispatch = useWorkspaceDispatch()

  const compact = useMediaQuery('(max-width:599.95px)')
  const medium = useMediaQuery('(min-width:600px) and (max-width:839.95px)')
  const railWidth = 84
  const drawerWidth = 264
  const collapsedDrawerWidth = 64
  const drawerSnapPoint =
    collapsedDrawerWidth + (drawerWidth - collapsedDrawerWidth) * 0.45

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [minitoolOpen, setMinitoolOpen] = useState(false)
  const [saveLocationOpen, setSaveLocationOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState('')
  const [snackbar, setSnackbar] = useState({ type: 'success', message: '' })
  const [searchState, setSearchState] = useState({
    query: '',
    replaceValue: '',
    caseSensitive: false,
    cursor: -1,
  })
  const [activeNav, setActiveNav] = useState('workspace')
  const [desktopDrawerCollapsed, setDesktopDrawerCollapsed] = useState(false)
  const [desktopDrawerWidth, setDesktopDrawerWidth] = useState(null)
  const [desktopDrawerDragging, setDesktopDrawerDragging] = useState(false)

  const t = useMemo(() => tFor(state.language), [state.language])
  const editorRefs = useRef({ html: null, css: null, js: null })
  const localStorageTimerRef = useRef(null)
  const drawerDragRef = useRef({
    startX: 0,
    startWidth: drawerWidth,
    liveWidth: drawerWidth,
  })
  const ownerKey = useMemo(() => getOwnerKey(), [])
  const registerEditorRef = useCallback((fileKey, node) => {
    editorRefs.current[fileKey] = node
  }, [])
  const desktopDrawerActive = !compact && !medium
  const drawerCurrentWidth = desktopDrawerActive
    ? desktopDrawerWidth ?? (desktopDrawerCollapsed ? collapsedDrawerWidth : drawerWidth)
    : drawerWidth
  const drawerTextReveal = desktopDrawerActive
    ? clamp(
        (drawerCurrentWidth - (collapsedDrawerWidth + 8)) /
          (drawerWidth - (collapsedDrawerWidth + 8)),
        0,
        1,
      )
    : 1
  const drawerIconOnly = drawerTextReveal < 0.2

  const currentContent = state.files[state.activeFile]
  const searchMatches = useMemo(
    () => computeMatches(currentContent, searchState.query, searchState.caseSensitive),
    [currentContent, searchState.caseSensitive, searchState.query],
  )

  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_STATE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      dispatch({
        type: 'SET_PROJECT',
        payload: {
          id: parsed.projectId,
          title: parsed.title,
          files: parsed.files,
          language: parsed.language,
          theme: parsed.themeMode,
          editorPrefs: parsed.editorPrefs,
          workspacePrefs: parsed.workspacePrefs,
          updatedAt: parsed.updatedAt,
        },
      })
    } catch {
      // ignore invalid local state
    }
  }, [dispatch])

  useEffect(() => {
    if (localStorageTimerRef.current) {
      clearTimeout(localStorageTimerRef.current)
    }
    localStorageTimerRef.current = setTimeout(() => {
      localStorage.setItem(
        LOCAL_STATE_KEY,
        JSON.stringify({
          projectId: state.projectId,
          title: state.title,
          files: state.files,
          language: state.language,
          themeMode: state.themeMode,
          editorPrefs: state.editorPrefs,
          workspacePrefs: state.workspacePrefs,
          updatedAt: state.cloud.updatedAt,
        }),
      )
    }, 300)
    return () => {
      if (localStorageTimerRef.current) {
        clearTimeout(localStorageTimerRef.current)
      }
    }
  }, [state])

  useEffect(() => {
    document.documentElement.lang = state.language
  }, [state.language])

  const replaceCurrentFile = useCallback(
    (value) => {
      dispatch({
        type: 'SET_FILE_CONTENT',
        payload: {
          file: state.activeFile,
          value,
        },
      })
    },
    [dispatch, state.activeFile],
  )

  const selectMatch = useCallback(
    (index, length) => {
      const target = editorRefs.current[state.activeFile]
      if (!target) return
      target.focus()
      target.setSelectionRange(index, index + length)
    },
    [state.activeFile],
  )

  const handleFindNext = useCallback(() => {
    if (!searchState.query || searchMatches.length === 0) return
    const next =
      searchMatches.find((match) => match.index > searchState.cursor) ||
      searchMatches[0]
    setSearchState((prev) => ({ ...prev, cursor: next.index }))
    selectMatch(next.index, next.length)
  }, [searchMatches, searchState.cursor, searchState.query, selectMatch])

  const handleReplaceNext = useCallback(() => {
    if (!searchState.query || searchMatches.length === 0) return
    const next =
      searchMatches.find((match) => match.index > searchState.cursor) ||
      searchMatches[0]
    const replaced = replaceAt(
      currentContent,
      next.index,
      next.index + next.length,
      searchState.replaceValue,
    )
    replaceCurrentFile(replaced)
    const newCursor = next.index + searchState.replaceValue.length - 1
    setSearchState((prev) => ({ ...prev, cursor: newCursor }))
    selectMatch(next.index, searchState.replaceValue.length)
  }, [
    currentContent,
    replaceCurrentFile,
    searchMatches,
    searchState.cursor,
    searchState.query,
    searchState.replaceValue,
    selectMatch,
  ])

  const handleReplaceAll = useCallback(() => {
    if (!searchState.query) return
    const flags = searchState.caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(escapeRegExp(searchState.query), flags)
    replaceCurrentFile(currentContent.replace(regex, searchState.replaceValue))
    setSearchState((prev) => ({ ...prev, cursor: -1 }))
  }, [
    currentContent,
    replaceCurrentFile,
    searchState.caseSensitive,
    searchState.query,
    searchState.replaceValue,
  ])

  const handleFormat = useCallback(
    async (target) => {
      try {
        if (target === 'all') {
          const [html, css, js] = await Promise.all([
            formatSource('html', state.files.html),
            formatSource('css', state.files.css),
            formatSource('js', state.files.js),
          ])
          dispatch({ type: 'SET_FILES', payload: { html, css, js } })
          return
        }
        const next = await formatSource(target, state.files[target])
        dispatch({
          type: 'SET_FILE_CONTENT',
          payload: { file: target, value: next },
        })
      } catch {
        setSnackbar({ type: 'error', message: t('formatError') })
      }
    },
    [dispatch, state.files, t],
  )

  const loadProjectList = useCallback(async () => {
    setProjectsLoading(true)
    setProjectsError('')
    try {
      const result = await listProjects(ownerKey)
      setProjects(result)
    } catch (error) {
      setProjectsError(error.message || t('loadError'))
    } finally {
      setProjectsLoading(false)
    }
  }, [ownerKey, t])

  const handleSaveToLocal = useCallback(() => {
    try {
      const payload = {
        title: state.title || t('untitledProject'),
        files: state.files,
        language: state.language,
        theme: state.themeMode,
        editorPrefs: state.editorPrefs,
        workspacePrefs: {
          previewMode: state.workspacePrefs.previewMode,
        },
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem('cookwire_project', JSON.stringify(payload))
      setSnackbar({ type: 'success', message: 'ローカルに保存しました' })
      setSaveLocationOpen(false)
    } catch (error) {
      setSnackbar({ type: 'error', message: 'ローカル保存に失敗しました' })
    }
  }, [
    state.title,
    state.files,
    state.language,
    state.themeMode,
    state.editorPrefs,
    state.workspacePrefs.previewMode,
    t,
  ])

  const handleSaveProject = useCallback(async () => {
    dispatch({
      type: 'SET_CLOUD_STATE',
      payload: { saving: true, error: '', message: '' },
    })
    try {
      const payload = {
        title: state.title || t('untitledProject'),
        files: state.files,
        language: state.language,
        theme: state.themeMode,
        editorPrefs: state.editorPrefs,
        workspacePrefs: {
          previewMode: state.workspacePrefs.previewMode,
        },
      }
      const data = state.projectId
        ? await updateProject(ownerKey, state.projectId, payload)
        : await createProject(ownerKey, payload)
      dispatch({ type: 'SET_PROJECT', payload: data })
      dispatch({
        type: 'SET_CLOUD_STATE',
        payload: {
          saving: false,
          message: t('saveSuccess'),
          updatedAt: data.updatedAt,
        },
      })
      setSnackbar({ type: 'success', message: t('saveSuccess') })
      setSaveLocationOpen(false)
    } catch (error) {
      dispatch({
        type: 'SET_CLOUD_STATE',
        payload: { saving: false, error: error.message || t('saveError') },
      })
      setSnackbar({ type: 'error', message: error.message || t('saveError') })
    }
  }, [
    dispatch,
    ownerKey,
    state.editorPrefs,
    state.files,
    state.language,
    state.projectId,
    state.themeMode,
    state.title,
    state.workspacePrefs.previewMode,
    t,
  ])

  const handleOpenProjects = useCallback(async () => {
    setActiveNav('projects')
    setProjectsOpen(true)
    await loadProjectList()
  }, [loadProjectList])

  const handleLoadProject = useCallback(
    async (projectId) => {
      try {
        const data = await getProject(ownerKey, projectId)
        dispatch({ type: 'SET_PROJECT', payload: data })
        setProjectsOpen(false)
      } catch (error) {
        setProjectsError(error.message || t('loadError'))
      }
    },
    [dispatch, ownerKey, t],
  )

  const toggleTheme = useCallback(() => {
    dispatch({
      type: 'SET_THEME_MODE',
      payload: state.themeMode === 'dark' ? 'light' : 'dark',
    })
  }, [dispatch, state.themeMode])

  const togglePreviewMode = useCallback(() => {
    dispatch({
      type: 'SET_PREVIEW_MODE',
      payload:
        state.workspacePrefs.previewMode === 'desktop' ? 'mobile' : 'desktop',
    })
  }, [dispatch, state.workspacePrefs.previewMode])

  const handleDrawerDragStart = useCallback(
    (event) => {
      if (!desktopDrawerActive) return
      event.preventDefault()
      if (event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      const startWidth = desktopDrawerCollapsed ? collapsedDrawerWidth : drawerWidth
      drawerDragRef.current = {
        startX: event.clientX,
        startWidth,
        liveWidth: startWidth,
      }
      setDesktopDrawerWidth(startWidth)
      setDesktopDrawerDragging(true)
    },
    [desktopDrawerActive, desktopDrawerCollapsed, collapsedDrawerWidth, drawerWidth],
  )

  const handleDrawerDragMove = useCallback(
    (event) => {
      if (!desktopDrawerDragging) return
      const delta = event.clientX - drawerDragRef.current.startX
      const nextWidth = clamp(
        drawerDragRef.current.startWidth + delta,
        collapsedDrawerWidth,
        drawerWidth,
      )
      drawerDragRef.current.liveWidth = nextWidth
      setDesktopDrawerWidth(nextWidth)
    },
    [desktopDrawerDragging, collapsedDrawerWidth, drawerWidth],
  )

  const handleDrawerDragEnd = useCallback(() => {
    if (!desktopDrawerDragging) return
    const snappedOpen = drawerDragRef.current.liveWidth >= drawerSnapPoint
    setDesktopDrawerCollapsed(!snappedOpen)
    setDesktopDrawerWidth(null)
    setDesktopDrawerDragging(false)
  }, [desktopDrawerDragging, drawerSnapPoint])

  const toggleCommentSelection = useCallback(() => {
    const target = editorRefs.current[state.activeFile]
    if (!target) return

    const marker = commentMarkers[state.activeFile]
    const value = state.files[state.activeFile]
    const start = target.selectionStart
    const end = target.selectionEnd
    const selected = value.slice(start, end)
    const lines = selected.split('\n')
    const isWrapped = lines.every((line) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      return (
        trimmed.startsWith(marker.prefix.trim()) &&
        (marker.suffix ? trimmed.endsWith(marker.suffix.trim()) : true)
      )
    })

    const nextLines = lines.map((line) => {
      if (!line.trim()) return line
      if (!isWrapped) return `${marker.prefix}${line}${marker.suffix}`
      let next = line
      next = next.replace(marker.prefix, '')
      if (marker.suffix) {
        const suffixIndex = next.lastIndexOf(marker.suffix)
        if (suffixIndex >= 0) {
          next = `${next.slice(0, suffixIndex)}${next.slice(
            suffixIndex + marker.suffix.length,
          )}`
        }
      }
      return next
    })

    const replaced = replaceAt(value, start, end, nextLines.join('\n'))
    replaceCurrentFile(replaced)
  }, [replaceCurrentFile, state.activeFile, state.files])

  useEffect(() => {
    const onKeyDown = (event) => {
      const mod = event.metaKey || event.ctrlKey

      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void handleSaveProject()
        return
      }

      if (mod && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setSearchOpen(true)
        return
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === 'h') {
        event.preventDefault()
        setSearchOpen(true)
        return
      }

      if (mod && event.key === '/') {
        event.preventDefault()
        toggleCommentSelection()
        return
      }

      if (event.altKey && ['1', '2', '3'].includes(event.key)) {
        const mapping = { '1': 'html', '2': 'css', '3': 'js' }
        dispatch({ type: 'SET_ACTIVE_FILE', payload: mapping[event.key] })
        return
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false)
        setSearchOpen(false)
        setProjectsOpen(false)
        setSettingsOpen(false)
        setActiveNav((prev) => (prev === 'settings' ? 'workspace' : prev))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, handleSaveProject, toggleCommentSelection])

  useEffect(() => {
    if (!desktopDrawerDragging) return
    window.addEventListener('pointermove', handleDrawerDragMove)
    window.addEventListener('pointerup', handleDrawerDragEnd)
    window.addEventListener('pointercancel', handleDrawerDragEnd)
    return () => {
      window.removeEventListener('pointermove', handleDrawerDragMove)
      window.removeEventListener('pointerup', handleDrawerDragEnd)
      window.removeEventListener('pointercancel', handleDrawerDragEnd)
    }
  }, [desktopDrawerDragging, handleDrawerDragEnd, handleDrawerDragMove])

  useEffect(() => {
    if (desktopDrawerActive) return
    setDesktopDrawerWidth(null)
    setDesktopDrawerDragging(false)
  }, [desktopDrawerActive])

  const commands = useMemo(
    () => [
      {
        id: 'format-current',
        label: t('formatCurrent'),
        shortcut: 'Cmd/Ctrl+Shift+F',
        icon: 'code',
        run: () => handleFormat(state.activeFile),
      },
      {
        id: 'format-all',
        label: t('formatAll'),
        icon: 'code',
        run: () => handleFormat('all'),
      },
      {
        id: 'format-html',
        label: t('formatHtml'),
        icon: 'code',
        run: () => handleFormat('html'),
      },
      {
        id: 'format-css',
        label: t('formatCss'),
        icon: 'code',
        run: () => handleFormat('css'),
      },
      {
        id: 'format-js',
        label: t('formatJs'),
        icon: 'code',
        run: () => handleFormat('js'),
      },
      {
        id: 'toggle-preview-mode',
        label: 'Toggle Preview Mode',
        icon: 'preview',
        run: togglePreviewMode,
      },
      {
        id: 'save-project',
        label: t('saveProject'),
        shortcut: 'Cmd/Ctrl+S',
        icon: 'save',
        run: () => void handleSaveProject(),
      },
      {
        id: 'open-projects',
        label: t('openProjects'),
        icon: 'project',
        run: () => void handleOpenProjects(),
      },
      {
        id: 'toggle-theme',
        label: t('toggleTheme'),
        icon: state.themeMode === 'dark' ? 'light' : 'dark',
        run: toggleTheme,
      },
      {
        id: 'open-search',
        label: t('searchReplace'),
        shortcut: 'Cmd/Ctrl+F',
        icon: 'search',
        run: () => setSearchOpen(true),
      },
    ],
    [
      handleFormat,
      handleOpenProjects,
      handleSaveProject,
      state.activeFile,
      state.themeMode,
      t,
      togglePreviewMode,
      toggleTheme,
    ],
  )

  const navDestinations = useMemo(
    () => [
      { key: 'workspace', label: t('workspace'), icon: <TerminalRounded /> },
      { key: 'projects', label: t('projects'), icon: <FolderOpenRounded /> },
      { key: 'minitool', label: t('minitool'), icon: <BuildRounded /> },
      { key: 'settings', label: t('settings'), icon: <SettingsRounded /> },
    ],
    [t],
  )

  const actionDestinations = useMemo(
    () => [
      { key: 'search', label: t('searchReplace'), icon: <SearchRounded /> },
      {
        key: 'commands',
        label: t('commandPalette'),
        icon: <KeyboardCommandKeyRounded />,
      },
      { key: 'save', label: t('saveProject'), icon: <SaveRounded /> },
      {
        key: 'theme',
        label: t('toggleTheme'),
        icon:
          state.themeMode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />,
      },
    ],
    [state.themeMode, t],
  )

  const activateDestination = useCallback(
    (key) => {
      setActiveNav(key)
      if (key === 'settings') {
        setSettingsOpen(true)
      }
      if (key === 'projects') {
        void handleOpenProjects()
      }
      if (key === 'minitool') {
        setMinitoolOpen(true)
      }
    },
    [handleOpenProjects],
  )

  const runSidebarAction = useCallback(
    (key) => {
      if (key === 'search') {
        setSearchOpen(true)
        return
      }
      if (key === 'commands') {
        setCommandPaletteOpen(true)
        return
      }
      if (key === 'save') {
        void handleSaveProject()
        return
      }
      if (key === 'theme') {
        toggleTheme()
      }
    },
    [handleSaveProject, toggleTheme],
  )

  const railNavigation = medium ? (
    <Paper
      sx={(theme) => ({
        borderRadius: 4,
        p: 0.75,
        backgroundColor: theme.custom.surfaceContainer,
      })}
    >
      <List sx={{ p: 0, display: 'grid', gap: 0.5, px: 0.25 }}>
        {navDestinations.map((item) => {
          const selected = activeNav === item.key
          return (
            <ListItemButton
              key={item.key}
              selected={selected}
              onClick={() => activateDestination(item.key)}
              aria-label={item.label}
              sx={{
                minHeight: 68,
                px: 0.5,
                py: 1,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Box
                sx={(theme) => ({
                  width: 56,
                  height: 32,
                  borderRadius: '16px',
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: 'transparent',
                  color: selected
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                })}
              >
                {item.icon}
              </Box>
              <Typography
                variant="labelSmall"
                sx={{ color: selected ? 'text.primary' : 'text.secondary' }}
              >
                {item.label}
              </Typography>
            </ListItemButton>
          )
        })}
        {actionDestinations.map((item) => (
          <ListItemButton
            key={item.key}
            onClick={() => runSidebarAction(item.key)}
            aria-label={item.label}
            sx={{
              minHeight: 64,
              px: 0.5,
              py: 1,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 32,
                borderRadius: '16px',
                display: 'grid',
                placeItems: 'center',
                backgroundColor: 'transparent',
                color: 'text.secondary',
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="labelSmall" sx={{ color: 'text.secondary' }}>
              {item.label}
            </Typography>
          </ListItemButton>
        ))}
      </List>
    </Paper>
  ) : null

  const drawerNavigation = desktopDrawerActive ? (
    <Box
      sx={{
        position: 'relative',
        width: drawerCurrentWidth,
        minWidth: drawerCurrentWidth,
        flexShrink: 0,
      }}
    >
      <Drawer
        variant="permanent"
        open
        sx={(theme) => ({
          width: drawerCurrentWidth,
          minWidth: drawerCurrentWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerCurrentWidth,
            minWidth: drawerCurrentWidth,
            overflow: 'hidden',
            position: 'relative',
            boxSizing: 'border-box',
            border: 'none',
            borderRadius: 4,
            p: 0.75,
            transition: desktopDrawerDragging
              ? 'none'
              : theme.transitions.create('width', {
                  duration: 360,
                  easing: 'cubic-bezier(0.2, 0.9, 0.22, 1.05)',
                }),
          },
        })}
      >
        <List
          sx={(theme) => ({
            p: 0,
            display: 'grid',
            gap: 0.5,
            px: 0.5,
            transition: desktopDrawerDragging
              ? 'none'
              : [
                  `padding 220ms ${theme.transitions.easing.easeOut}`,
                ].join(', '),
          })}
        >
          {navDestinations.map((item) => (
            <ListItemButton
              key={item.key}
              selected={activeNav === item.key}
              onClick={() => activateDestination(item.key)}
              aria-label={item.label}
              sx={{
                minHeight: 52,
                px: drawerIconOnly ? 0 : 1.75,
                justifyContent: drawerIconOnly ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: drawerIconOnly ? 0 : 36,
                  mr: drawerIconOnly ? 0 : 0.5,
                  color: 'inherit',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {drawerIconOnly ? null : (
                <ListItemText
                  primary={item.label}
                  sx={(theme) => ({
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: `${drawerTextReveal * 132}px`,
                    opacity: drawerTextReveal,
                    transform: `translateX(${(1 - drawerTextReveal) * -8}px)`,
                    transition: desktopDrawerDragging
                      ? 'none'
                      : [
                          `opacity 180ms ${theme.transitions.easing.easeOut}`,
                          `transform 220ms ${theme.transitions.easing.easeOut}`,
                          `max-width 220ms ${theme.transitions.easing.easeOut}`,
                        ].join(', '),
                  })}
                />
              )}
            </ListItemButton>
          ))}
          {actionDestinations.map((item) => (
            <ListItemButton
              key={item.key}
              onClick={() => runSidebarAction(item.key)}
              aria-label={item.label}
              sx={{
                minHeight: 50,
                px: drawerIconOnly ? 0 : 1.75,
                justifyContent: drawerIconOnly ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: drawerIconOnly ? 0 : 36,
                  mr: drawerIconOnly ? 0 : 0.5,
                  color: 'inherit',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {drawerIconOnly ? null : (
                <ListItemText
                  primary={item.label}
                  sx={(theme) => ({
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: `${drawerTextReveal * 132}px`,
                    opacity: drawerTextReveal,
                    transform: `translateX(${(1 - drawerTextReveal) * -8}px)`,
                    transition: desktopDrawerDragging
                      ? 'none'
                      : [
                          `opacity 180ms ${theme.transitions.easing.easeOut}`,
                          `transform 220ms ${theme.transitions.easing.easeOut}`,
                          `max-width 220ms ${theme.transitions.easing.easeOut}`,
                        ].join(', '),
                  })}
                />
              )}
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        role="presentation"
        aria-label={t('sidebarSnapHandle')}
        onPointerDown={handleDrawerDragStart}
        sx={{
          position: 'absolute',
          top: 0,
          right: -10,
          bottom: 0,
          width: 20,
          zIndex: 3,
          cursor: desktopDrawerDragging ? 'grabbing' : 'ew-resize',
          touchAction: 'none',
          backgroundColor: 'transparent',
        }}
      />
    </Box>
  ) : null

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="transparent">
        <Toolbar
          sx={{
            minHeight: 64,
            pl: { xs: 1, sm: 4.75 },
            pr: { xs: 1, sm: 2 },
            gap: 0.5,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                letterSpacing: 0,
                fontSize: { xs: 26, sm: 30 },
                lineHeight: 1,
                fontWeight: 700,
                fontFamily: '"BIZ UDPGothic", sans-serif',
              }}
            >
              {t('appName')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={t('searchReplace')}>
              <IconButton onClick={() => setSearchOpen(true)}>
                <SearchRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('commandPalette')}>
              <IconButton onClick={() => setCommandPaletteOpen(true)}>
                <KeyboardCommandKeyRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('openProjects')}>
              <IconButton
                onClick={() => {
                  setActiveNav('projects')
                  void handleOpenProjects()
                }}
              >
                <FolderOpenRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('settings')}>
              <IconButton
                onClick={() => {
                  setActiveNav('settings')
                  setSettingsOpen(true)
                }}
              >
                <SettingsRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('toggleTheme')}>
              <IconButton onClick={toggleTheme}>
                {state.themeMode === 'dark' ? (
                  <LightModeRounded />
                ) : (
                  <DarkModeRounded />
                )}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<PlayArrowRounded />}
              onClick={() => {
                dispatch({ type: 'SYNC_PREVIEW_NOW' })
                setSnackbar({ type: 'success', message: t('previewUpdated') || 'Preview updated' })
              }}
              sx={{ ml: 0.5 }}
            >
              {compact ? 'Run' : t('run')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveRounded />}
              onClick={() => setSaveLocationOpen(true)}
              disabled={state.cloud.saving}
              sx={{ ml: 0.5 }}
            >
              {compact ? 'Save' : t('saveProject')}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          px: { xs: 1, sm: 2 },
          pt: 1,
          pb: compact ? '84px' : 2,
          height: compact ? 'calc(100dvh - 64px)' : 'calc(100dvh - 64px)',
          minHeight: compact ? 'calc(100vh - 64px)' : 'calc(100vh - 64px)',
          display: 'grid',
          gridTemplateColumns: compact
            ? '1fr'
            : medium
              ? `${railWidth}px minmax(0, 1fr)`
              : `${drawerCurrentWidth}px minmax(0, 1fr)`,
          gap: 0.75,
        }}
      >
        {railNavigation}
        {drawerNavigation}

        <Box
          component="main"
          sx={(theme) => ({
            minHeight: 0,
            height: '100%',
            display: 'grid',
            gridTemplateRows: compact ? 'auto minmax(0, 1fr) auto' : 'minmax(0, 1fr)',
            gap: compact ? 1 : '4px',
            borderRadius: 4,
            p: compact ? 1 : '4px',
            backgroundColor: theme.custom.surfaceContainer,
          })}
        >
          {compact ? (
            <Paper
              sx={{
                p: 0.75,
                borderRadius: 3,
                backgroundColor: 'transparent',
              }}
            >
              <ToggleButtonGroup
                fullWidth
                size="small"
                exclusive
                value={state.workspacePrefs.mobilePane}
                onChange={(_event, next) => {
                  if (next) {
                    dispatch({ type: 'SET_MOBILE_PANE', payload: next })
                  }
                }}
              >
                <ToggleButton value="editor">{t('editor')}</ToggleButton>
                <ToggleButton value="preview">{t('preview')}</ToggleButton>
              </ToggleButtonGroup>
            </Paper>
          ) : null}

          <Box
            sx={(theme) => ({
              minHeight: 0,
              height: '100%',
              display: 'grid',
              gridTemplateColumns: compact
                ? '1fr'
                : 'minmax(0, 1fr) minmax(0, 1fr)',
              gridTemplateRows: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              gap: compact ? 1 : '4px',
              p: compact ? 0 : '4px',
              borderRadius: compact ? 0 : 3,
              overflow: 'hidden',
              backgroundColor: compact
                ? 'transparent'
                : theme.palette.background.paper,
            })}
          >
            {compact && state.workspacePrefs.mobilePane === 'editor' ? (
              <EditorWorkspace
                files={state.files}
                activeFile={state.activeFile}
                editorPrefs={state.editorPrefs}
                dispatch={dispatch}
                t={t}
                onRegisterEditorRef={registerEditorRef}
              />
            ) : null}
            {compact && state.workspacePrefs.mobilePane === 'preview' ? (
              <PreviewPane
                previewFiles={state.previewFiles}
                language={state.language}
                t={t}
              />
            ) : null}
            {!compact ? (
              <>
                <EditorPane
                  fileKey="html"
                  label={t('html')}
                  value={state.files.html}
                  editorPrefs={state.editorPrefs}
                  dispatch={dispatch}
                  t={t}
                  onRegisterEditorRef={registerEditorRef}
                />
                <EditorPane
                  fileKey="css"
                  label={t('css')}
                  value={state.files.css}
                  editorPrefs={state.editorPrefs}
                  dispatch={dispatch}
                  t={t}
                  onRegisterEditorRef={registerEditorRef}
                />
                <EditorPane
                  fileKey="js"
                  label={t('javascript')}
                  value={state.files.js}
                  editorPrefs={state.editorPrefs}
                  dispatch={dispatch}
                  t={t}
                  onRegisterEditorRef={registerEditorRef}
                />
                <PreviewPane
                  previewFiles={state.previewFiles}
                  language={state.language}
                  t={t}
                />
              </>
            ) : null}
          </Box>

          {compact ? (
            <Paper
              sx={{
                px: 1.25,
                py: 0.75,
                borderRadius: 3,
                backgroundColor: 'transparent',
              }}
            >
              <Typography variant="labelMedium" color="text.secondary">
                {t('keyShortcuts')}: Cmd/Ctrl+K, Cmd/Ctrl+F, Cmd/Ctrl+Shift+H,
                Cmd/Ctrl+S, Alt+1/2/3
              </Typography>
            </Paper>
          ) : null}
        </Box>
      </Box>

      {compact ? (
        <Paper
          square
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            borderRadius: 0,
          }}
        >
          <BottomNavigation
            showLabels
            value={activeNav}
            onChange={(_event, value) => {
              activateDestination(value)
            }}
            sx={{
              height: 64,
              pb: 'env(safe-area-inset-bottom)',
            }}
          >
            <BottomNavigationAction
              value="workspace"
              label={t('workspace')}
              icon={<TerminalRounded />}
            />
            <BottomNavigationAction
              value="projects"
              label={t('projects')}
              icon={<FolderOpenRounded />}
            />
            <BottomNavigationAction
              value="minitool"
              label={t('minitool')}
              icon={<BuildRounded />}
            />
            <BottomNavigationAction
              value="settings"
              label={t('settings')}
              icon={<SettingsRounded />}
            />
          </BottomNavigation>
        </Paper>
      ) : null}

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
        t={t}
      />

      <SearchReplacePanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={searchState.query}
        replaceValue={searchState.replaceValue}
        caseSensitive={searchState.caseSensitive}
        matches={searchMatches.length}
        onChangeQuery={(value) =>
          setSearchState((prev) => ({ ...prev, query: value, cursor: -1 }))
        }
        onChangeReplace={(value) =>
          setSearchState((prev) => ({ ...prev, replaceValue: value }))
        }
        onToggleCase={(checked) =>
          setSearchState((prev) => ({
            ...prev,
            caseSensitive: checked,
            cursor: -1,
          }))
        }
        onFindNext={handleFindNext}
        onReplaceNext={handleReplaceNext}
        onReplaceAll={handleReplaceAll}
        t={t}
      />

      <ProjectBrowser
        open={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        projects={projects}
        loading={projectsLoading}
        error={projectsError}
        onReload={() => void loadProjectList()}
        onLoadProject={(id) => void handleLoadProject(id)}
        t={t}
      />

      <SettingsView
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false)
          if (activeNav === 'settings') {
            setActiveNav('workspace')
          }
        }}
        state={state}
        dispatch={dispatch}
        t={t}
      />

      <MinitoolView
        open={minitoolOpen}
        onClose={() => {
          setMinitoolOpen(false)
          if (activeNav === 'minitool') {
            setActiveNav('workspace')
          }
        }}
        t={t}
      />

      <Dialog
        open={saveLocationOpen}
        onClose={() => setSaveLocationOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('selectSaveLocation')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<SaveRounded />}
              onClick={() => void handleSaveProject()}
              disabled={state.cloud.saving}
            >
              {t('saveToServer')}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SaveRounded />}
              onClick={handleSaveToLocal}
            >
              {t('saveToLocal')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSaveLocationOpen(false)} variant="text">
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbar.message)}
        autoHideDuration={2400}
        onClose={() => setSnackbar({ type: 'success', message: '' })}
      >
        <Alert
          onClose={() => setSnackbar({ type: 'success', message: '' })}
          severity={snackbar.type}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
