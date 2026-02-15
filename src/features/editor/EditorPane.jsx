import { Box, Paper, Typography } from '@mui/material'
import { memo, useCallback, useMemo, useRef } from 'react'

function placeholderFor(fileKey) {
  if (fileKey === 'html') return '<section>...</section>'
  if (fileKey === 'css') return '.class { ... }'
  return 'console.log()'
}

const EditorPane = memo(function EditorPane({
  fileKey,
  label,
  value,
  editorPrefs,
  dispatch,
  onRegisterEditorRef,
  t,
}) {
  const lines = useMemo(() => value.split('\n').length, [value])
  const internalRef = useRef(null)

  const refCallback = useCallback(
    (node) => {
      internalRef.current = node
      onRegisterEditorRef(fileKey, node)
    },
    [fileKey, onRegisterEditorRef],
  )

  const handleFocus = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_FILE', payload: fileKey })
  }, [dispatch, fileKey])

  const handleChange = useCallback(
    (event) => {
      dispatch({
        type: 'SET_FILE_CONTENT',
        payload: { file: fileKey, value: event.target.value },
      })
    },
    [dispatch, fileKey],
  )

  return (
    <Paper
      sx={(theme) => ({
        height: '100%',
        borderRadius: 1,
        p: 0.75,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
        backgroundColor: theme.custom.workspaceCanvas,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, pb: 0.5 }}>
        <Typography variant="labelLarge">{label}</Typography>
        <Typography variant="labelSmall" color="text.secondary" sx={{ ml: 'auto' }}>
          {lines} lines
        </Typography>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          borderRadius: 0.75,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        <Box
          component="textarea"
          ref={refCallback}
          aria-label={`${t('ariaEditor')} ${fileKey}`}
          value={value}
          onFocus={handleFocus}
          onChange={handleChange}
          spellCheck={false}
          className="editor-textarea"
          placeholder={placeholderFor(fileKey)}
          style={{
            fontFamily: '"Google Sans", sans-serif',
            fontSize: `${editorPrefs.fontSize}px`,
            lineHeight: editorPrefs.lineHeight,
            color: 'inherit',
          }}
        />
      </Box>
    </Paper>
  )
})

export default EditorPane
