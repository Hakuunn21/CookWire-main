import { Box, Button, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import ReactSrcDocIframe from 'react-srcdoc-iframe'

function buildSrcDoc(state) {
  return `<!doctype html>
<html lang="${state.language}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
html, body { margin: 0; background: transparent; }
${state.previewFiles.css}
</style>
</head>
<body>
${state.previewFiles.html}
<script>${state.previewFiles.js}</script>
</body>
</html>`
}

export default function PreviewPane({ state, dispatch, t }) {
  return (
    <Paper
      sx={{
        height: '100%',
        borderRadius: 4,
        p: 1,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.75, pb: 1 }}>
        <Typography variant="labelLarge" sx={{ mr: 'auto' }}>
          {t('preview')}
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={state.workspacePrefs.previewMode}
          onChange={(_event, next) => {
            if (next) dispatch({ type: 'SET_PREVIEW_MODE', payload: next })
          }}
        >
          <ToggleButton value="desktop">{t('previewDesktop')}</ToggleButton>
          <ToggleButton value="mobile">{t('previewMobile')}</ToggleButton>
        </ToggleButtonGroup>

        {!state.editorPrefs.autoPreview ? (
          <Button size="small" variant="text" onClick={() => dispatch({ type: 'SYNC_PREVIEW_NOW' })}>
            Sync
          </Button>
        ) : null}
      </Box>

      <Box
        sx={{
          minHeight: 0,
          borderRadius: 3,
          p: 1,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
      >
        <Box
          sx={{
            width: state.workspacePrefs.previewMode === 'mobile' ? 390 : '100%',
            maxWidth: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'transparent',
          }}
        >
          <ReactSrcDocIframe
            title={t('ariaPreview')}
            srcDoc={buildSrcDoc(state)}
            sandbox="allow-scripts"
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              display: 'block',
              background: 'transparent',
            }}
          />
        </Box>
      </Box>
    </Paper>
  )
}
