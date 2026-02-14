const DEFAULT_FILES = {
  html: '',
  css: '',
  js: '',
}

export const DEFAULT_STATE = {
  projectId: null,
  title: 'Untitled Project',
  files: { ...DEFAULT_FILES },
  previewFiles: { ...DEFAULT_FILES },
  previewVersion: 0,
  activeFile: 'html',
  language: 'en',
  themeMode: 'dark',
  editorPrefs: {
    fontSize: 14,
    lineHeight: 1.6,
    autoPreview: true,
  },
  workspacePrefs: {
    previewMode: 'desktop',
    mobilePane: 'editor',
    mobileSplitRatio: 0.55,
    mobileConsoleOpen: false,
  },
  cloud: {
    saving: false,
    message: '',
    error: '',
    updatedAt: null,
  },
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const syncPreview = (state, filesOverride) => {
  if (!state.editorPrefs.autoPreview) return state
  return {
    ...state,
    previewFiles: filesOverride || state.files,
    previewVersion: state.previewVersion + 1,
  }
}

export const workspaceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROJECT': {
      const nextFiles = {
        html: action.payload.files?.html || '',
        css: action.payload.files?.css || '',
        js: action.payload.files?.js || '',
      }
      return {
        ...state,
        projectId: action.payload.id || null,
        title: action.payload.title || state.title,
        files: nextFiles,
        previewFiles: nextFiles,
        previewVersion: state.previewVersion + 1,
        language: action.payload.language || state.language,
        themeMode: action.payload.theme || state.themeMode,
        editorPrefs: {
          ...state.editorPrefs,
          ...(action.payload.editorPrefs || {}),
        },
        workspacePrefs: {
          ...state.workspacePrefs,
          ...(action.payload.workspacePrefs || {}),
        },
        cloud: {
          ...state.cloud,
          updatedAt: action.payload.updatedAt || state.cloud.updatedAt,
          error: '',
          message: '',
        },
      }
    }
    case 'SET_TITLE':
      return { ...state, title: action.payload.slice(0, 80) }
    case 'SET_ACTIVE_FILE':
      return { ...state, activeFile: action.payload }
    case 'SET_FILE_CONTENT': {
      const files = {
        ...state.files,
        [action.payload.file]: action.payload.value,
      }
      return syncPreview({ ...state, files }, files)
    }
    case 'SET_FILES': {
      const files = {
        html: action.payload.html ?? state.files.html,
        css: action.payload.css ?? state.files.css,
        js: action.payload.js ?? state.files.js,
      }
      return syncPreview({ ...state, files }, files)
    }
    case 'SYNC_PREVIEW_NOW':
      return {
        ...state,
        previewFiles: { ...state.files },
        previewVersion: state.previewVersion + 1,
      }
    case 'SET_THEME_MODE':
      return { ...state, themeMode: action.payload === 'light' ? 'light' : 'dark' }
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload === 'ja' ? 'ja' : 'en' }
    case 'SET_PREVIEW_MODE':
      return {
        ...state,
        workspacePrefs: {
          ...state.workspacePrefs,
          previewMode: action.payload === 'mobile' ? 'mobile' : 'desktop',
        },
      }
    case 'SET_MOBILE_PANE':
      return {
        ...state,
        workspacePrefs: {
          ...state.workspacePrefs,
          mobilePane: action.payload === 'preview' ? 'preview' : 'editor',
        },
      }
    case 'SET_MOBILE_SPLIT_RATIO':
      return {
        ...state,
        workspacePrefs: {
          ...state.workspacePrefs,
          mobileSplitRatio: clamp(action.payload, 0.2, 0.85),
        },
      }
    case 'SET_MOBILE_CONSOLE_OPEN':
      return {
        ...state,
        workspacePrefs: {
          ...state.workspacePrefs,
          mobileConsoleOpen: Boolean(action.payload),
        },
      }
    case 'SET_EDITOR_PREF': {
      const next = {
        ...state.editorPrefs,
        ...action.payload,
      }
      if (typeof next.fontSize === 'number') next.fontSize = clamp(next.fontSize, 12, 20)
      if (typeof next.lineHeight === 'number') next.lineHeight = clamp(next.lineHeight, 1.2, 2.1)
      return {
        ...state,
        editorPrefs: next,
      }
    }
    case 'SET_CLOUD_STATE':
      return {
        ...state,
        cloud: {
          ...state.cloud,
          ...action.payload,
        },
      }
    case 'RESET_MESSAGES':
      return {
        ...state,
        cloud: {
          ...state.cloud,
          message: '',
          error: '',
        },
      }
    default:
      return state
  }
}
