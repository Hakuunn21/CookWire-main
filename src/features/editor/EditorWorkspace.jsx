import { Box, Paper, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import {
  CodeRounded,
  BrushRounded,
  JavascriptRounded,
} from "@mui/icons-material";
import { memo, useCallback, useMemo } from "react";
import { placeholderFor } from "./editorUtils";

const FILE_KEYS = ["html", "css", "js"];

const EditorWorkspace = memo(function EditorWorkspace({
  files,
  activeFile,
  editorPrefs,
  dispatch,
  t,
  onRegisterEditorRef,
}) {
  const activeLines = useMemo(
    () => files[activeFile].split("\n").length,
    [files, activeFile],
  );

  const handleTabChange = useCallback(
    (_event, next) => dispatch({ type: "SET_ACTIVE_FILE", payload: next }),
    [dispatch],
  );

  return (
    <Paper
      sx={(theme) => ({
        height: "100%",
        borderRadius: 2,
        p: 1,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        overflow: "hidden",
        backgroundColor: theme.custom.workspaceCanvas,
      })}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.75, pb: 1 }}
      >
        <Tabs value={activeFile} onChange={handleTabChange}>
          <Tooltip title={t("html")} arrow>
            <Tab
              value="html"
              icon={<CodeRounded />}
              disableRipple
              sx={{ minWidth: 48 }}
            />
          </Tooltip>
          <Tooltip title={t("css")} arrow>
            <Tab
              value="css"
              icon={<BrushRounded />}
              disableRipple
              sx={{ minWidth: 48 }}
            />
          </Tooltip>
          <Tooltip title={t("javascript")} arrow>
            <Tab
              value="js"
              icon={<JavascriptRounded />}
              disableRipple
              sx={{ minWidth: 48 }}
            />
          </Tooltip>
        </Tabs>

        <Typography
          variant="labelMedium"
          color="text.secondary"
          sx={{ ml: "auto" }}
        >
          {activeLines} lines
        </Typography>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          borderRadius: 1.5,
          overflow: "hidden",
          backgroundColor: "transparent",
          boxShadow: "none",
        }}
      >
        {FILE_KEYS.map((fileKey) => {
          const visible = activeFile === fileKey;
          return (
            <Box
              key={fileKey}
              role="tabpanel"
              hidden={!visible}
              sx={{ display: visible ? "block" : "none", height: "100%" }}
            >
              <Box
                component="textarea"
                ref={(node) => {
                  onRegisterEditorRef(fileKey, node);
                }}
                aria-label={`${t("ariaEditor")} ${fileKey}`}
                value={files[fileKey]}
                onChange={(event) =>
                  dispatch({
                    type: "SET_FILE_CONTENT",
                    payload: { file: fileKey, value: event.target.value },
                  })
                }
                spellCheck={false}
                className="editor-textarea"
                placeholder={placeholderFor(fileKey)}
                style={{
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: `${editorPrefs.fontSize}px`,
                  lineHeight: editorPrefs.lineHeight,
                  color: "inherit",
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
});

export default EditorWorkspace;
