import { Box, Paper } from '@mui/material'
import { memo, useMemo } from 'react'
import ReactSrcDocIframe from 'react-srcdoc-iframe'

const CONSOLE_CAPTURE_SCRIPT = `
<script>
(function(){
  var methods = ['log','info','warn','error'];
  methods.forEach(function(m){
    var orig = console[m];
    console[m] = function(){
      var args = Array.prototype.slice.call(arguments).map(function(a){
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch(e) { return String(a); }
      });
      try { window.parent.postMessage({type:'console',method:m,args:args},'*'); } catch(e){}
      orig.apply(console, arguments);
    };
  });
  window.onerror = function(msg, src, line, col, err){
    try {
      window.parent.postMessage({type:'console',method:'error',args:[msg + ' (line ' + line + ')']},'*');
    } catch(e){}
  };
})();
</script>`

function buildSrcDoc(previewFiles, language) {
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${CONSOLE_CAPTURE_SCRIPT}
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

const PreviewPane = memo(function PreviewPane({ previewFiles, language, t, mobile = false }) {
  const srcDoc = useMemo(
    () => buildSrcDoc(previewFiles, language),
    [previewFiles, language],
  )

  return (
    <Paper
      sx={(theme) => ({
        height: '100%',
        borderRadius: mobile ? 0 : 2,
        p: mobile ? 0 : 0.75,
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: theme.custom.workspaceCanvas,
      })}
    >

      <Box
        sx={{
          flex: 1,
          borderRadius: mobile ? 0 : 1.5,
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
