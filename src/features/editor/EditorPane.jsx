import { Box, Paper, Typography } from '@mui/material'

function countLines(value) {
  return value.split('\n').length
}

function placeholderFor(fileKey) {
  if (fileKey === 'html') return '<section>...</section>'
  if (fileKey === 'css') return '.class { ... }'
  return 'console.log()'
}

export default function EditorPane({
  fileKey,
  label,
  state,
  dispatch,
  onRegisterEditorRef,
  t,
}) {
  const value = state.files[fileKey]
  const lines = countLines(value)

  return (
    <Paper
      sx={{
        height: '100%',
        borderRadius: 3,
        p: 0.75,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
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
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        <Box
          component="textarea"
          ref={(node) => {
            onRegisterEditorRef(fileKey, node)
          }}
          aria-label={`${t('ariaEditor')} ${fileKey}`}
          value={value}
          onFocus={() => dispatch({ type: 'SET_ACTIVE_FILE', payload: fileKey })}
          onChange={(event) =>
            dispatch({
              type: 'SET_FILE_CONTENT',
              payload: { file: fileKey, value: event.target.value },
            })
          }
          spellCheck={false}
          className="editor-textarea"
          placeholder={placeholderFor(fileKey)}
          style={{
            fontFamily: '"BIZ UDPGothic", sans-serif',
            fontSize: `${state.editorPrefs.fontSize}px`,
            lineHeight: state.editorPrefs.lineHeight,
            color: 'inherit',
          }}
        />
      </Box>
    </Paper>
  )
}
