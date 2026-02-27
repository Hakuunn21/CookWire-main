import { useState, useCallback } from "react";
import JSZip from "jszip";

export function useFileOperations(state, t, setSnackbar) {
  const [saveLocationOpen, setSaveLocationOpen] = useState(false);

  const handleSaveToLocal = useCallback(() => {
    try {
      // SECURITY: Validate data before saving
      const payload = {
        title: (state.title || t("untitledProject")).slice(0, 120),
        files: {
          html: String(state.files.html || "").slice(0, 500000),
          css: String(state.files.css || "").slice(0, 500000),
          js: String(state.files.js || "").slice(0, 500000),
        },
        language: state.language === "ja" ? "ja" : "en",
        theme: state.themeMode === "light" ? "light" : "dark",
        editorPrefs: {
          fontSize: Math.min(
            Math.max(Number(state.editorPrefs.fontSize) || 14, 12),
            20,
          ),
          lineHeight: Math.min(
            Math.max(Number(state.editorPrefs.lineHeight) || 1.6, 1.2),
            2.1,
          ),
          autoPreview: Boolean(state.editorPrefs.autoPreview),
        },
        workspacePrefs: {
          previewMode:
            state.workspacePrefs.previewMode === "mobile"
              ? "mobile"
              : "desktop",
        },
        savedAt: new Date().toISOString(),
      };

      // Check storage quota before saving
      const payloadStr = JSON.stringify(payload);
      if (payloadStr.length > 5 * 1024 * 1024) {
        // 5MB limit
        throw new Error("Project too large for local storage");
      }

      localStorage.setItem("cookwire_project", payloadStr);
      setSnackbar({ type: "success", message: "ローカルに保存しました" });
      setSaveLocationOpen(false);
    } catch (error) {
      console.error("Local save failed:", error);
      setSnackbar({ type: "error", message: "ローカル保存に失敗しました" });
    }
  }, [
    state.title,
    state.files,
    state.language,
    state.themeMode,
    state.editorPrefs,
    state.workspacePrefs.previewMode,
    t,
    setSnackbar,
  ]);

  const handleDownloadZip = useCallback(async () => {
    try {
      const zip = new JSZip();
      zip.file("index.html", state.files.html);
      zip.file("style.css", state.files.css);
      zip.file("script.js", state.files.js);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Sanitize filename to prevent path traversal and XSS
      const sanitizeFilename = (name) => {
        return (
          name
            // eslint-disable-next-line no-control-regex
            .replace(/[\\/<>:"|?*\x00-\x1F]/g, "_") // Remove illegal chars
            .replace(/\.{2,}/g, "_") // Prevent path traversal
            .replace(/^\.+/, "") // Remove leading dots
            .slice(0, 100) || "project"
        ); // Limit length
      };
      const safeTitle = sanitizeFilename(state.title || "project");
      a.download = `${safeTitle}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        type: "success",
        message: t("downloadSuccess") || "ZIP Downloaded",
      });
      setSaveLocationOpen(false);
    } catch (error) {
      console.error("ZIP generation failed:", error);
      setSnackbar({
        type: "error",
        message: t("downloadError") || "ZIP Generation Failed",
      });
    }
  }, [state.files, state.title, t, setSnackbar]);

  return {
    saveLocationOpen,
    setSaveLocationOpen,
    handleSaveToLocal,
    handleDownloadZip,
  };
}
