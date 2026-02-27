import {
  BuildRounded,
  CssRounded,
  DarkModeRounded,
  FileDownloadRounded,
  FolderOpenRounded,
  Google,
  HtmlRounded,
  JavascriptRounded,
  KeyboardCommandKeyRounded,
  LightModeRounded,
  LoginRounded,
  LogoutRounded,
  PlayArrowRounded,
  SaveRounded,
  SearchRounded,
  SettingsRounded,
  TerminalRounded,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CommandPalette from "../features/editor/CommandPalette";
import EditorPane from "../features/editor/EditorPane";
import PreviewPane from "../features/preview/PreviewPane";
import ProjectBrowser from "../features/project/ProjectBrowser";
import SearchReplacePanel from "../features/editor/SearchReplacePanel";
import SettingsView from "../features/settings/SettingsView";
import MinitoolView from "../features/minitool/MinitoolView";
import InfoView from "../features/info/InfoView";
import MobileShell from "../features/mobile/MobileShell";
import { tFor } from "../i18n";
import {
  useWorkspaceDispatch,
  useWorkspaceState,
} from "../state/WorkspaceContext";
import { formatSource } from "../utils/formatCode";
import { getOwnerKey } from "../utils/ownerKey";
import { useSearchReplace } from "../features/editor/useSearchReplace";
import { useFileOperations } from "../features/project/useFileOperations";
import { useProjectManagement } from "../features/project/useProjectManagement";
import { useAppDrawer } from "./useAppDrawer";

const commentMarkers = {
  html: { prefix: "<!-- ", suffix: " -->" },
  css: { prefix: "/* ", suffix: " */" },
  js: { prefix: "// ", suffix: "" },
};

export default function AppShell() {
  const state = useWorkspaceState();
  const dispatch = useWorkspaceDispatch();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [minitoolOpen, setMinitoolOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoType, setInfoType] = useState("company");
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ type: "success", message: "" });
  const [activeNav, setActiveNav] = useState("workspace");

  const t = useMemo(() => tFor(state.language), [state.language]);
  const editorRefs = useRef({ html: null, css: null, js: null });

  // ownerKey は初回のみ取得する（毎レンダリングで localStorage にアクセスしない）
  const [ownerKey] = useState(() => getOwnerKey());

  const registerEditorRef = useCallback((fileType, ref) => {
    editorRefs.current[fileType] = ref;
  }, []);

  const handleGoogleLogin = useCallback(() => {
    setTimeout(() => {
      setCurrentUser({ name: "Demo User", email: "demo@example.com" });
      setLoginOpen(false);
      setSnackbar({
        type: "success",
        message: t("loginSuccess") || "Successfully logged in",
      });
    }, 1000);
  }, [t]);

  const handleOpenInfo = useCallback((type) => {
    setInfoType(type);
    setInfoOpen(true);
  }, []);

  const {
    compact,
    medium,
    railWidth,
    desktopDrawerDragging,
    desktopDrawerActive,
    drawerCurrentWidth,
    drawerTextReveal,
    drawerIconOnly,
    handleDrawerDragStart,
    handleDrawerDragMove,
    handleDrawerDragEnd,
  } = useAppDrawer();

  const currentContent = state.files[state.activeFile];

  const replaceCurrentFile = useCallback(
    (value) => {
      dispatch({
        type: "SET_FILE_CONTENT",
        payload: { file: state.activeFile, value },
      });
    },
    [dispatch, state.activeFile],
  );

  const searchReplace = useSearchReplace(
    currentContent,
    state.activeFile,
    replaceCurrentFile,
    editorRefs,
  );

  const handleFormat = useCallback(
    async (target) => {
      try {
        if (target === "all") {
          const [html, css, js] = await Promise.all([
            formatSource("html", state.files.html),
            formatSource("css", state.files.css),
            formatSource("js", state.files.js),
          ]);
          dispatch({ type: "SET_FILES", payload: { html, css, js } });
          return;
        }
        const next = await formatSource(target, state.files[target]);
        dispatch({
          type: "SET_FILE_CONTENT",
          payload: { file: target, value: next },
        });
      } catch {
        setSnackbar({ type: "error", message: t("formatError") });
      }
    },
    [dispatch, state.files, t],
  );

  const {
    projectsOpen,
    setProjectsOpen,
    projects,
    projectsLoading,
    projectsError,
    loadProjectList,
    handleSaveProject,
    handleOpenProjects,
    handleLoadProject,
    handleOpenLocalFolder,
  } = useProjectManagement(
    state,
    dispatch,
    ownerKey,
    t,
    setSnackbar,
    setActiveNav,
  );

  const {
    saveLocationOpen,
    setSaveLocationOpen,
    handleSaveToLocal,
    handleDownloadZip,
  } = useFileOperations(state, t, setSnackbar);

  const isFilesEmpty = useMemo(
    () => Object.values(state.files).every((content) => !content.trim()),
    [state.files],
  );

  const toggleTheme = useCallback(() => {
    dispatch({
      type: "SET_THEME_MODE",
      payload: state.themeMode === "dark" ? "light" : "dark",
    });
  }, [dispatch, state.themeMode]);

  const togglePreviewMode = useCallback(() => {
    dispatch({
      type: "SET_PREVIEW_MODE",
      payload:
        state.workspacePrefs.previewMode === "desktop" ? "mobile" : "desktop",
    });
  }, [dispatch, state.workspacePrefs.previewMode]);

  const toggleCommentSelection = useCallback(() => {
    const target = editorRefs.current[state.activeFile];
    if (!target) return;

    const marker = commentMarkers[state.activeFile];
    const value = state.files[state.activeFile];
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const selected = value.slice(start, end);
    const lines = selected.split("\n");
    const isWrapped = lines.every((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      return (
        trimmed.startsWith(marker.prefix.trim()) &&
        (marker.suffix ? trimmed.endsWith(marker.suffix.trim()) : true)
      );
    });

    const nextLines = lines.map((line) => {
      if (!line.trim()) return line;
      if (!isWrapped) return `${marker.prefix}${line}${marker.suffix}`;
      let next = line;
      next = next.replace(marker.prefix, "");
      if (marker.suffix) {
        const suffixIndex = next.lastIndexOf(marker.suffix);
        if (suffixIndex >= 0) {
          next = `${next.slice(0, suffixIndex)}${next.slice(suffixIndex + marker.suffix.length)}`;
        }
      }
      return next;
    });

    const replaced =
      value.slice(0, start) + nextLines.join("\n") + value.slice(end);
    replaceCurrentFile(replaced);
  }, [replaceCurrentFile, state.activeFile, state.files]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSaveProject();
        return;
      }
      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchReplace.openSearch();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        searchReplace.openSearch();
        return;
      }
      if (mod && event.key === "/") {
        event.preventDefault();
        toggleCommentSelection();
        return;
      }
      if (event.altKey && ["1", "2", "3"].includes(event.key)) {
        const mapping = { 1: "html", 2: "css", 3: "js" };
        dispatch({ type: "SET_ACTIVE_FILE", payload: mapping[event.key] });
        return;
      }
      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        searchReplace.closeSearch();
        setProjectsOpen(false);
        setSettingsOpen(false);
        setActiveNav((prev) => (prev === "settings" ? "workspace" : prev));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    dispatch,
    handleSaveProject,
    toggleCommentSelection,
    searchReplace,
    setProjectsOpen,
  ]);

  useEffect(() => {
    if (!desktopDrawerDragging) return;
    window.addEventListener("pointermove", handleDrawerDragMove);
    window.addEventListener("pointerup", handleDrawerDragEnd);
    window.addEventListener("pointercancel", handleDrawerDragEnd);
    return () => {
      window.removeEventListener("pointermove", handleDrawerDragMove);
      window.removeEventListener("pointerup", handleDrawerDragEnd);
      window.removeEventListener("pointercancel", handleDrawerDragEnd);
    };
  }, [desktopDrawerDragging, handleDrawerDragEnd, handleDrawerDragMove]);

  const commands = useMemo(
    () => [
      {
        id: "format-current",
        label: t("formatCurrent"),
        shortcut: "Cmd/Ctrl+Shift+F",
        icon: "code",
        run: () => handleFormat(state.activeFile),
      },
      {
        id: "format-all",
        label: t("formatAll"),
        icon: "code",
        run: () => handleFormat("all"),
      },
      {
        id: "format-html",
        label: t("formatHtml"),
        icon: "code",
        run: () => handleFormat("html"),
      },
      {
        id: "format-css",
        label: t("formatCss"),
        icon: "code",
        run: () => handleFormat("css"),
      },
      {
        id: "format-js",
        label: t("formatJs"),
        icon: "code",
        run: () => handleFormat("js"),
      },
      {
        id: "toggle-preview-mode",
        label: "Toggle Preview Mode",
        icon: "preview",
        run: togglePreviewMode,
      },
      {
        id: "save-project",
        label: t("saveProject"),
        shortcut: "Cmd/Ctrl+S",
        icon: "save",
        run: () => void handleSaveProject(),
      },
      {
        id: "open-projects",
        label: t("openProjects"),
        icon: "project",
        run: () => void handleOpenProjects(),
      },
      {
        id: "toggle-theme",
        label: t("toggleTheme"),
        icon: state.themeMode === "dark" ? "light" : "dark",
        run: toggleTheme,
      },
      {
        id: "open-search",
        label: t("searchReplace"),
        shortcut: "Cmd/Ctrl+F",
        icon: "search",
        run: searchReplace.openSearch,
      },
    ],
    [
      handleFormat,
      handleOpenProjects,
      handleSaveProject,
      searchReplace.openSearch,
      state.activeFile,
      state.themeMode,
      t,
      togglePreviewMode,
      toggleTheme,
    ],
  );

  const navDestinations = useMemo(
    () => [
      { key: "workspace", label: t("workspace"), icon: <TerminalRounded /> },
      { key: "projects", label: t("projects"), icon: <FolderOpenRounded /> },
      { key: "minitool", label: t("minitool"), icon: <BuildRounded /> },
      { key: "settings", label: t("settings"), icon: <SettingsRounded /> },
    ],
    [t],
  );

  const actionDestinations = useMemo(
    () => [
      {
        key: "commands",
        label: t("commandPalette"),
        icon: <KeyboardCommandKeyRounded />,
      },
    ],
    [t],
  );

  const activateDestination = useCallback(
    (key) => {
      setActiveNav(key);
      if (key === "settings") setSettingsOpen(true);
      if (key === "projects") void handleOpenProjects();
      if (key === "minitool") setMinitoolOpen(true);
    },
    [handleOpenProjects],
  );

  const runSidebarAction = useCallback(
    (key) => {
      if (key === "search") {
        searchReplace.openSearch();
        return;
      }
      if (key === "commands") {
        setCommandPaletteOpen(true);
        return;
      }
      if (key === "save") {
        void handleSaveProject();
        return;
      }
      if (key === "theme") toggleTheme();
    },
    [handleSaveProject, toggleTheme, searchReplace],
  );

  // ── 共通ナビゲーションアイテムレンダラー（ドロワー用）────────────────
  const drawerNavItemSx = (iconOnly) => ({
    minHeight: 52,
    px: iconOnly ? 0 : 1.25,
    justifyContent: iconOnly ? "center" : "flex-start",
  });

  const drawerIconSx = (iconOnly) => ({
    minWidth: iconOnly ? 0 : 32,
    mr: iconOnly ? 0 : 0.25,
    color: "inherit",
    display: "grid",
    placeItems: "center",
  });

  const drawerTextSx = (theme) => ({
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: `${drawerTextReveal * 132}px`,
    opacity: drawerTextReveal,
    transform: `translateX(${(1 - drawerTextReveal) * -8}px)`,
    transition: desktopDrawerDragging
      ? "none"
      : [
          `opacity 180ms ${theme.transitions.easing.easeOut}`,
          `transform 220ms ${theme.transitions.easing.easeOut}`,
          `max-width 220ms ${theme.transitions.easing.easeOut}`,
        ].join(", "),
  });

  // ── 共通 Dialog（保存先選択・ログイン） ─────────────────────────────
  const saveLocationDialog = (
    <Dialog
      open={saveLocationOpen}
      onClose={() => setSaveLocationOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle>{t("selectSaveLocation")}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<SaveRounded />}
            disabled
          >
            {t("saveToServer")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<SaveRounded />}
            onClick={handleSaveToLocal}
          >
            {t("saveToLocal")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<FileDownloadRounded />}
            onClick={() => void handleDownloadZip()}
          >
            {t("downloadZip")}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setSaveLocationOpen(false)} variant="text">
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const loginDialog = (
    <Dialog
      open={loginOpen}
      onClose={() => setLoginOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: "none",
          bgcolor: "background.paper",
          p: 3,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography
          variant="headlineSmall"
          component="h2"
          sx={{ mb: 1, fontWeight: 700 }}
        >
          {t("welcome")}
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 280, lineHeight: 1.6 }}
        >
          {t("loginDescription") ||
            "ログインすると、プロジェクトを同期できるようになります"}
        </Typography>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<Google />}
          onClick={handleGoogleLogin}
          disabled
          sx={{
            py: 1.5,
            borderRadius: 999,
            color: "text.primary",
            borderColor: "divider",
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500,
            justifyContent: "center",
            opacity: 0.5,
            "&:hover": { borderColor: "divider", bgcolor: "action.hover" },
          }}
        >
          {t("signInWithGoogle") || "Sign in with Google (Coming soon)"}
        </Button>
        <Button
          onClick={() => setLoginOpen(false)}
          variant="text"
          sx={{
            mt: 2,
            borderRadius: 999,
            px: 3,
            textTransform: "none",
            color: "text.secondary",
          }}
        >
          {t("continueAsGuest") || "Continue as Guest"}
        </Button>
      </Box>
    </Dialog>
  );

  const sharedDialogs = (
    <>
      {saveLocationDialog}
      {loginDialog}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
        t={t}
      />
      <SearchReplacePanel
        open={searchReplace.open}
        onClose={searchReplace.closeSearch}
        query={searchReplace.query}
        replaceValue={searchReplace.replaceValue}
        caseSensitive={searchReplace.caseSensitive}
        matches={searchReplace.matches.length}
        onChangeQuery={searchReplace.setQuery}
        onChangeReplace={searchReplace.setReplaceValue}
        onToggleCase={searchReplace.setCaseSensitive}
        onFindNext={searchReplace.handleFindNext}
        onReplaceNext={searchReplace.handleReplaceNext}
        onReplaceAll={searchReplace.handleReplaceAll}
        t={t}
      />
      <ProjectBrowser
        open={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        projects={projects}
        loading={projectsLoading}
        error={projectsError}
        onReload={() => void loadProjectList()}
        onLoadProject={(id) => void handleLoadProject(id)}
        onOpenLocalFolder={handleOpenLocalFolder}
        t={t}
      />
      <SettingsView
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          if (activeNav === "settings") setActiveNav("workspace");
        }}
        state={state}
        dispatch={dispatch}
        t={t}
      />
      <MinitoolView
        open={minitoolOpen}
        onClose={() => {
          setMinitoolOpen(false);
          if (activeNav === "minitool") setActiveNav("workspace");
        }}
        t={t}
      />
      <InfoView
        open={infoOpen}
        type={infoType}
        onClose={() => setInfoOpen(false)}
        t={t}
      />
      <Snackbar
        open={Boolean(snackbar.message)}
        autoHideDuration={2400}
        onClose={() => setSnackbar({ type: "success", message: "" })}
      >
        <Alert
          onClose={() => setSnackbar({ type: "success", message: "" })}
          severity={snackbar.type}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );

  // ── ログインボタン（ナビ共通） ────────────────────────────────────────
  const loginNavLabel = currentUser
    ? t("logout") || "Log out"
    : t("login") || "Log in (Coming soon)";

  // ── モバイルレイアウト ────────────────────────────────────────────────
  if (compact) {
    return (
      <Box
        sx={{
          height: "100dvh",
          width: "100vw",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <MobileShell
          state={state}
          dispatch={dispatch}
          t={t}
          currentUser={currentUser}
          onLogin={() => setLoginOpen(true)}
          onLogout={() => {
            setCurrentUser(null);
            setSnackbar({
              type: "success",
              message: t("loggedOut") || "Logged out",
            });
          }}
          onRegisterEditorRef={registerEditorRef}
          onOpenSearch={searchReplace.openSearch}
          onOpenCommands={() => setCommandPaletteOpen(true)}
          onOpenProjects={() => {
            setActiveNav("projects");
            void handleOpenProjects();
          }}
          onOpenSettings={() => {
            setActiveNav("settings");
            setSettingsOpen(true);
          }}
          onOpenMinitool={() => {
            setActiveNav("minitool");
            setMinitoolOpen(true);
          }}
          onOpenInfo={handleOpenInfo}
          onSave={() => void handleSaveProject()}
          onSaveLocationOpen={() => setSaveLocationOpen(true)}
          onToggleTheme={toggleTheme}
          onFormat={handleFormat}
          onRun={() => {
            dispatch({ type: "SYNC_PREVIEW_NOW" });
            setSnackbar({ type: "success", message: t("previewUpdated") });
          }}
        />
        {sharedDialogs}
      </Box>
    );
  }

  // ── Rail ナビゲーション（中サイズ） ──────────────────────────────────
  const railNavigation = medium ? (
    <Paper
      sx={(theme) => ({
        borderRadius: 4,
        p: 0.75,
        backgroundColor: theme.custom.surfaceContainer,
      })}
    >
      <List sx={{ p: 0, display: "grid", gap: 0.5, px: 0.25 }}>
        {navDestinations.map((item) => {
          const selected = activeNav === item.key;
          const isDisabled = item.key === "projects";
          return (
            <ListItemButton
              key={item.key}
              selected={selected}
              onClick={() => {
                if (!isDisabled) activateDestination(item.key);
              }}
              disabled={isDisabled}
              aria-label={item.label}
              sx={{
                minHeight: 68,
                px: 0.5,
                py: 1,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: 0.5,
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <Box
                sx={(theme) => ({
                  width: 56,
                  height: 32,
                  borderRadius: "16px",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "transparent",
                  color: selected
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                })}
              >
                {item.icon}
              </Box>
              <Typography
                variant="labelSmall"
                sx={{ color: selected ? "text.primary" : "text.secondary" }}
              >
                {item.label}
              </Typography>
            </ListItemButton>
          );
        })}
        {actionDestinations.map((item) => (
          <ListItemButton
            key={item.key}
            onClick={() => runSidebarAction(item.key)}
            aria-label={item.label}
            sx={{
              minHeight: 64,
              px: 0.5,
              py: 1,
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 32,
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                backgroundColor: "transparent",
                color: "text.secondary",
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="labelSmall" sx={{ color: "text.secondary" }}>
              {item.label}
            </Typography>
          </ListItemButton>
        ))}
        <ListItemButton
          disabled
          onClick={() => {
            currentUser ? setCurrentUser(null) : setLoginOpen(true);
          }}
          aria-label={loginNavLabel}
          sx={{
            minHeight: 64,
            px: 0.5,
            py: 1,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 0.5,
            opacity: 0.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 32,
              borderRadius: "16px",
              display: "grid",
              placeItems: "center",
              backgroundColor: "transparent",
              color: "text.secondary",
            }}
          >
            {currentUser ? <LogoutRounded /> : <LoginRounded />}
          </Box>
          <Typography variant="labelSmall" sx={{ color: "text.secondary" }}>
            {loginNavLabel}
          </Typography>
        </ListItemButton>
      </List>
    </Paper>
  ) : null;

  // ── Drawer ナビゲーション（デスクトップ） ─────────────────────────────
  const drawerNavigation = desktopDrawerActive ? (
    <Box
      sx={{
        position: "relative",
        width: drawerCurrentWidth,
        minWidth: drawerCurrentWidth,
        flexShrink: 0,
      }}
    >
      <Drawer
        variant="permanent"
        open
        sx={(theme) => ({
          width: drawerCurrentWidth,
          minWidth: drawerCurrentWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerCurrentWidth,
            minWidth: drawerCurrentWidth,
            overflow: "hidden",
            position: "relative",
            boxSizing: "border-box",
            border: "none",
            borderRadius: 4,
            p: 0.75,
            display: "flex",
            flexDirection: "column",
            transition: desktopDrawerDragging
              ? "none"
              : theme.transitions.create("width", {
                  duration: 360,
                  easing: "cubic-bezier(0.2, 0.9, 0.22, 1.05)",
                }),
          },
        })}
      >
        <List
          sx={(theme) => ({
            p: 0,
            display: "grid",
            gap: 0.5,
            px: 0.5,
            transition: desktopDrawerDragging
              ? "none"
              : [`padding 220ms ${theme.transitions.easing.easeOut}`].join(
                  ", ",
                ),
          })}
        >
          {navDestinations.map((item) => {
            const isDisabled = item.key === "projects";
            return (
              <ListItemButton
                key={item.key}
                selected={activeNav === item.key}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) activateDestination(item.key);
                }}
                aria-label={item.label}
                sx={{
                  ...drawerNavItemSx(drawerIconOnly),
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <ListItemIcon sx={drawerIconSx(drawerIconOnly)}>
                  {item.icon}
                </ListItemIcon>
                {drawerIconOnly ? null : (
                  <ListItemText primary={item.label} sx={drawerTextSx} />
                )}
              </ListItemButton>
            );
          })}
          {actionDestinations.map((item) => (
            <ListItemButton
              key={item.key}
              onClick={() => runSidebarAction(item.key)}
              aria-label={item.label}
              sx={{ ...drawerNavItemSx(drawerIconOnly), minHeight: 50 }}
            >
              <ListItemIcon sx={drawerIconSx(drawerIconOnly)}>
                {item.icon}
              </ListItemIcon>
              {drawerIconOnly ? null : (
                <ListItemText primary={item.label} sx={drawerTextSx} />
              )}
            </ListItemButton>
          ))}
        </List>
        <ListItemButton
          disabled
          onClick={() => {
            currentUser ? setCurrentUser(null) : setLoginOpen(true);
          }}
          aria-label={loginNavLabel}
          sx={{
            ...drawerNavItemSx(drawerIconOnly),
            minHeight: 50,
            opacity: 0.5,
          }}
        >
          <ListItemIcon sx={drawerIconSx(drawerIconOnly)}>
            {currentUser ? <LogoutRounded /> : <LoginRounded />}
          </ListItemIcon>
          {drawerIconOnly ? null : (
            <ListItemText primary={loginNavLabel} sx={drawerTextSx} />
          )}
        </ListItemButton>
      </Drawer>

      <Box
        role="presentation"
        aria-label={t("sidebarSnapHandle")}
        onPointerDown={handleDrawerDragStart}
        sx={{
          position: "absolute",
          top: 0,
          right: -10,
          bottom: 0,
          width: 20,
          zIndex: 3,
          cursor: desktopDrawerDragging ? "grabbing" : "ew-resize",
          touchAction: "none",
          backgroundColor: "transparent",
        }}
      />
    </Box>
  ) : null;

  // ── デスクトップレイアウト ────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="transparent">
        <Toolbar
          sx={{
            py: 1,
            px: { xs: 1, sm: 2 },
            gap: 0.5,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1.75 }}>
            <Typography
              sx={{
                letterSpacing: 0,
                fontSize: { xs: 26, sm: 30 },
                lineHeight: 1,
                fontWeight: 700,
                fontFamily: '"BIZ UDPGothic", sans-serif',
              }}
            >
              {t("appName")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={t("searchReplace")}>
              <IconButton onClick={searchReplace.openSearch}>
                <SearchRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("commandPalette")}>
              <IconButton onClick={() => setCommandPaletteOpen(true)}>
                <KeyboardCommandKeyRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("projects")}>
              <IconButton
                disabled
                onClick={() => {
                  setActiveNav("projects");
                  void handleOpenProjects();
                }}
              >
                <FolderOpenRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("toggleTheme")}>
              <IconButton onClick={toggleTheme}>
                {state.themeMode === "dark" ? (
                  <LightModeRounded />
                ) : (
                  <DarkModeRounded />
                )}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<PlayArrowRounded />}
              onClick={() => {
                dispatch({ type: "SYNC_PREVIEW_NOW" });
                setSnackbar({ type: "success", message: t("previewUpdated") });
              }}
              sx={{ ml: 0.5 }}
            >
              {t("run")}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={isFilesEmpty ? <FolderOpenRounded /> : <SaveRounded />}
              onClick={() => {
                if (isFilesEmpty) void handleOpenProjects();
                else setSaveLocationOpen(true);
              }}
              disabled={!isFilesEmpty && state.cloud.saving}
              sx={{ ml: 0.5 }}
            >
              {isFilesEmpty ? t("openProjects") : t("saveProject")}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          px: { xs: 1, sm: 2 },
          pt: 0.5,
          pb: 2,
          height: "calc(100dvh - 64px)",
          minHeight: "calc(100vh - 64px)",
          display: "grid",
          gridTemplateColumns: medium
            ? `${railWidth}px minmax(0, 1fr)`
            : `${drawerCurrentWidth}px minmax(0, 1fr)`,
          gap: 0.5,
        }}
      >
        {railNavigation}
        {drawerNavigation}

        <Box
          component="main"
          sx={(theme) => ({
            minHeight: 0,
            height: "100%",
            display: "grid",
            gridTemplateRows: "minmax(0, 1fr) auto",
            gap: "2px",
            borderRadius: 2,
            p: "2px",
            backgroundColor: theme.custom.surfaceContainer,
          })}
        >
          <Box
            sx={(theme) => ({
              minHeight: 0,
              height: "100%",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gridTemplateRows: "repeat(2, minmax(0, 1fr))",
              gap: "2px",
              p: "2px",
              borderRadius: 1.5,
              overflow: "hidden",
              backgroundColor: theme.palette.background.paper,
            })}
          >
            <EditorPane
              fileKey="html"
              label={<HtmlRounded />}
              value={state.files.html}
              editorPrefs={state.editorPrefs}
              dispatch={dispatch}
              t={t}
              onRegisterEditorRef={registerEditorRef}
            />
            <EditorPane
              fileKey="css"
              label={<CssRounded />}
              value={state.files.css}
              editorPrefs={state.editorPrefs}
              dispatch={dispatch}
              t={t}
              onRegisterEditorRef={registerEditorRef}
            />
            <EditorPane
              fileKey="js"
              label={<JavascriptRounded />}
              value={state.files.js}
              editorPrefs={state.editorPrefs}
              dispatch={dispatch}
              t={t}
              onRegisterEditorRef={registerEditorRef}
            />
            <PreviewPane
              previewFiles={state.previewFiles}
              previewVersion={state.previewVersion}
              language={state.language}
              t={t}
            />
          </Box>

          <Box
            sx={{
              mt: "auto",
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              © 2024 CookWire
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {["company", "privacy", "terms", "oss"].map((key) => (
              <Button
                key={key}
                size="small"
                variant="text"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  textTransform: "none",
                }}
                onClick={() => handleOpenInfo(key)}
              >
                {t(key === "oss" ? "ossLicenses" : key)}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      {sharedDialogs}
    </Box>
  );
}
