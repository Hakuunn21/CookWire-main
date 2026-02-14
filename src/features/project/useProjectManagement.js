import { useState, useCallback } from 'react'
import { createProject, getProject, listProjects, updateProject } from '../../utils/projectApi'

export function useProjectManagement(
    state,
    dispatch,
    ownerKey,
    t,
    setSnackbar,
    setActiveNav,
) {
    const [projectsOpen, setProjectsOpen] = useState(false)
    const [projects, setProjects] = useState([])
    const [projectsLoading, setProjectsLoading] = useState(false)
    const [projectsError, setProjectsError] = useState('')

    const loadProjectList = useCallback(async () => {
        setProjectsLoading(true)
        setProjectsError('')
        try {
            const result = await listProjects(ownerKey)
            setProjects(result)
        } catch (error) {
            setProjectsError(error.message || t('loadError'))
        } finally {
            setProjectsLoading(false)
        }
    }, [ownerKey, t])

    const handleSaveProject = useCallback(async () => {
        dispatch({
            type: 'SET_CLOUD_STATE',
            payload: { saving: true, error: '', message: '' },
        })
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
            }
            const data = state.projectId
                ? await updateProject(ownerKey, state.projectId, payload)
                : await createProject(ownerKey, payload)
            dispatch({ type: 'SET_PROJECT', payload: data })
            dispatch({
                type: 'SET_CLOUD_STATE',
                payload: {
                    saving: false,
                    message: t('saveSuccess'),
                    updatedAt: data.updatedAt,
                },
            })
            setSnackbar({ type: 'success', message: t('saveSuccess') })
        } catch (error) {
            dispatch({
                type: 'SET_CLOUD_STATE',
                payload: { saving: false, error: error.message || t('saveError') },
            })
            setSnackbar({ type: 'error', message: error.message || t('saveError') })
        }
    }, [
        dispatch,
        ownerKey,
        state.editorPrefs,
        state.files,
        state.language,
        state.projectId,
        state.themeMode,
        state.title,
        state.workspacePrefs.previewMode,
        t,
        setSnackbar,
    ])

    const handleOpenProjects = useCallback(async () => {
        setActiveNav('projects')
        setProjectsOpen(true)
        await loadProjectList()
    }, [loadProjectList, setActiveNav])

    const handleLoadProject = useCallback(
        async (projectId) => {
            try {
                const data = await getProject(ownerKey, projectId)
                dispatch({ type: 'SET_PROJECT', payload: data })
                setProjectsOpen(false)
            } catch (error) {
                setProjectsError(error.message || t('loadError'))
            }
        },
        [dispatch, ownerKey, t],
    )

    const handleOpenLocalFolder = useCallback(async () => {
        try {
            if (!window.showDirectoryPicker) {
                throw new Error('File System Access API is not supported in this browser.')
            }

            const dirHandle = await window.showDirectoryPicker()
            const files = { html: '', css: '', js: '' }
            let title = dirHandle.name

            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile()
                    const content = await file.text()
                    const name = entry.name.toLowerCase()

                    if (name.endsWith('.html')) {
                        files.html = content
                    } else if (name.endsWith('.css')) {
                        files.css = content
                    } else if (name.endsWith('.js')) {
                        files.js = content
                    }
                }
            }

            dispatch({
                type: 'SET_PROJECT',
                payload: {
                    id: null,
                    title,
                    files,
                    language: state.language,
                    theme: state.themeMode,
                },
            })
            setProjectsOpen(false)
            setSnackbar({ type: 'success', message: `Opened folder: ${title}` })
        } catch (error) {
            if (error.name !== 'AbortError') {
                setSnackbar({ type: 'error', message: error.message })
            }
        }
    }, [dispatch, state.language, state.themeMode, setSnackbar])

    return {
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
    }
}
