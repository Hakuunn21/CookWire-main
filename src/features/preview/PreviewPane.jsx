import { Box, Paper } from '@mui/material'
import { memo, useMemo } from 'react'
import ReactSrcDocIframe from 'react-srcdoc-iframe'

function buildSrcDoc(previewFiles, language) {
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
html, body { margin: 0; background: transparent; }
${previewFiles.css}
</style>
</head>
<body>
${previewFiles.html}
<script>${previewFiles.js}</script>
</body>
</html>`
}

const PreviewPane = memo(function PreviewPane({ previewFiles, language, t }) {
  const srcDoc = useMemo(
    () => buildSrcDoc(previewFiles, language),
    [previewFiles, language],
  )

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
          key={JSON.stringify(previewFiles)}
          title={t('ariaPreview')}
          srcDoc={srcDoc}
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
})

export default PreviewPane
