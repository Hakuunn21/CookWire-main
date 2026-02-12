import { Box, Paper } from '@mui/material'
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

export default function PreviewPane({ state, t }) {
  return (
    <Paper
      sx={(theme) => ({
        height: '100%',
        borderRadius: 2,
        p: 0.75,
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: theme.custom.workspaceCanvas,
      })}
    >

      <Box
        sx={{
          flex: 1,
          borderRadius: 1.5,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        <ReactSrcDocIframe
          key={JSON.stringify(state.previewFiles)}
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
    </Paper>
  )
}
