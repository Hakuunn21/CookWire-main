import { Box, Paper } from "@mui/material";
import { memo, useMemo } from "react";

const CONSOLE_CAPTURE_SCRIPT = (parentOrigin) => `
<script>
(function(){
  var ALLOWED_ORIGIN = ${JSON.stringify(parentOrigin)};
  var methods = ['log','info','warn','error'];
  methods.forEach(function(m){
    var orig = console[m];
    console[m] = function(){
      var args = Array.prototype.slice.call(arguments).map(function(a){
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch(e) { return String(a); }
      });
      try { window.parent.postMessage({type:'console',method:m,args:args}, ALLOWED_ORIGIN); } catch(e){}
      orig.apply(console, arguments);
    };
  });
  window.onerror = function(msg, src, line, col, err){
    try {
      window.parent.postMessage({type:'console',method:'error',args:[msg + ' (line ' + line + ')']}, ALLOWED_ORIGIN);
    } catch(e){}
  };
})();
</script>`;

function buildSrcDoc(previewFiles, language, parentOrigin) {
  // Ensure origin is valid (fallback to 'null' for sandboxed iframe)
  const safeOrigin =
    parentOrigin && typeof parentOrigin === "string"
      ? parentOrigin.replace(/[<>"']/g, "")
      : window.location.origin;

  const safeJs = (previewFiles.js || "").replace(/<\/script>/g, "<\\/script>");
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${CONSOLE_CAPTURE_SCRIPT(safeOrigin)}
<style>
html, body { margin: 0; background: transparent; }
${previewFiles.css || ""}
</style>
</head>
<body>
${previewFiles.html || ""}
<script>${safeJs}</script>
</body>
</html>`;
}

const PreviewPane = memo(function PreviewPane({
  previewFiles,
  previewVersion,
  language,
  t,
  mobile = false,
}) {
  const srcDoc = useMemo(
    () => buildSrcDoc(previewFiles, language, window.location.origin),
    [previewFiles, language],
  );

  return (
    <Paper
      sx={(theme) => ({
        height: "100%",
        borderRadius: mobile ? 0 : 1,
        p: mobile ? 0 : 0.75,
        display: "flex",
        overflow: "hidden",
        backgroundColor: theme.custom.workspaceCanvas,
      })}
    >
      <Box
        sx={{
          flex: 1,
          borderRadius: mobile ? 0 : 0.75,
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        <iframe
          key={previewVersion}
          title={t("ariaPreview")}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
            background: "transparent",
          }}
        />
      </Box>
    </Paper>
  );
});

export default PreviewPane;
