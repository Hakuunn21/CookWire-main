import { Box, Paper, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import { CodeRounded, BrushRounded, JavascriptRounded } from '@mui/icons-material'

const files = ['html', 'css', 'js']

function countLines(value) {
  return value.split('\n').length
}

export default function EditorWorkspace({ state, dispatch, t, onRegisterEditorRef }) {
  const activeLines = countLines(state.files[state.activeFile])

  return (
    <Paper
      sx={(theme) => ({
        height: '100%',
        borderRadius: 2,
        p: 1,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
        backgroundColor: theme.custom.workspaceCanvas,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.75, pb: 1 }}>
        <Tabs value={state.activeFile} onChange={(_event, next) => dispatch({ type: 'SET_ACTIVE_FILE', payload: next })}>
          <Tooltip title={t('html')} arrow>
            <Tab
              value="html"
              icon={<CodeRounded />}
              disableRipple
              sx={{ minWidth: 48 }}
            />
          </Tooltip>
          <Tooltip title={t('css')} arrow>
            <Tab
              value="css"
              icon={<BrushRounded />}
              disableRipple
              sx={{ minWidth: 48 }}
            />
          </Tooltip>
          <Tooltip title={t('javascript')} arrow>
            <Tab
              value="js"
              icon={<JavascriptRounded />}
              disableRipple
              sx={{ minWidth: 48 }}
            />
          </Tooltip>
        </Tabs>

        <Typography variant="labelMedium" color="text.secondary" sx={{ ml: 'auto' }}>
          {activeLines} lines
        </Typography>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          borderRadius: 1.5,
          overflow: 'hidden',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
      >
        {files.map((fileKey) => {
          const visible = state.activeFile === fileKey
          return (
            <Box key={fileKey} role="tabpanel" hidden={!visible} sx={{ display: visible ? 'block' : 'none', height: '100%' }}>
              <Box
                component="textarea"
                ref={(node) => {
                  onRegisterEditorRef(fileKey, node)
                }}
                aria-label={`${t('ariaEditor')} ${fileKey}`}
                value={state.files[fileKey]}
                onChange={(event) =>
                  dispatch({
                    type: 'SET_FILE_CONTENT',
                    payload: { file: fileKey, value: event.target.value },
                  })
                }
                spellCheck={false}
                className="editor-textarea"
                placeholder={fileKey === 'html' ? '<section>...</section>' : fileKey === 'css' ? '.class { ... }' : 'console.log()'}
                style={{
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: `${state.editorPrefs.fontSize}px`,
                  lineHeight: state.editorPrefs.lineHeight,
                  color: 'inherit',
                }}
              />
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}
