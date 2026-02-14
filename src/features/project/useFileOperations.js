import { useState, useCallback } from 'react'
import JSZip from 'jszip'

export function useFileOperations(
    state,
    t,
    setSnackbar,
) {
    const [saveLocationOpen, setSaveLocationOpen] = useState(false)

    const handleSaveToLocal = useCallback(() => {
        try {
            const payload = {
                title: state.title || t('untitledProject'),
                files: state.files,
                language: state.language,
                theme: state.themeMode,
                editorPrefs: state.editorPrefs,
                workspacePrefs: {
                    previewMode: state.workspacePrefs.previewMode,
                },
                savedAt: new Date().toISOString(),
            }
            localStorage.setItem('cookwire_project', JSON.stringify(payload))
            setSnackbar({ type: 'success', message: 'ローカルに保存しました' })
            setSaveLocationOpen(false)
        } catch {
            setSnackbar({ type: 'error', message: 'ローカル保存に失敗しました' })
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
    ])

    const handleDownloadZip = useCallback(async () => {
        try {
            const zip = new JSZip()
            zip.file('index.html', state.files.html)
            zip.file('style.css', state.files.css)
            zip.file('script.js', state.files.js)

            const blob = await zip.generateAsync({ type: 'blob' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${state.title || 'project'}.zip`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            setSnackbar({ type: 'success', message: t('downloadSuccess') || 'ZIP Downloaded' })
            setSaveLocationOpen(false)
        } catch (error) {
            console.error('ZIP generation failed:', error)
            setSnackbar({ type: 'error', message: t('downloadError') || 'ZIP Generation Failed' })
        }
    }, [state.files, state.title, t, setSnackbar])

    return {
        saveLocationOpen,
        setSaveLocationOpen,
        handleSaveToLocal,
        handleDownloadZip,
    }
}
