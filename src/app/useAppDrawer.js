import { useState, useRef, useCallback } from 'react'
import { useMediaQuery } from '@mui/material'

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
}

const RAIL_WIDTH = 84
const DRAWER_WIDTH = 224
const COLLAPSED_DRAWER_WIDTH = 64
const MEDIA_QUERY_COMPACT = '(max-width:599.95px)'
const MEDIA_QUERY_MEDIUM = '(min-width:600px) and (max-width:839.95px)'

export function useAppDrawer() {
    const compact = useMediaQuery(MEDIA_QUERY_COMPACT)
    const medium = useMediaQuery(MEDIA_QUERY_MEDIUM)

    const [desktopDrawerCollapsed, setDesktopDrawerCollapsed] = useState(false)
    const [desktopDrawerWidth, setDesktopDrawerWidth] = useState(null)
    const [desktopDrawerDragging, setDesktopDrawerDragging] = useState(false)

    const drawerDragRef = useRef({
        startX: 0,
        startWidth: DRAWER_WIDTH,
        liveWidth: DRAWER_WIDTH,
    })

    const desktopDrawerActive = !compact && !medium

    const drawerSnapPoint =
        COLLAPSED_DRAWER_WIDTH + (DRAWER_WIDTH - COLLAPSED_DRAWER_WIDTH) * 0.45

    const drawerCurrentWidth = desktopDrawerActive
        ? desktopDrawerWidth ??
        (desktopDrawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH)
        : DRAWER_WIDTH

    const drawerTextReveal = desktopDrawerActive
        ? clamp(
            (drawerCurrentWidth - (COLLAPSED_DRAWER_WIDTH + 8)) /
            (DRAWER_WIDTH - (COLLAPSED_DRAWER_WIDTH + 8)),
            0,
            1,
        )
        : 1

    const drawerIconOnly = drawerTextReveal < 0.2

    const handleDrawerDragStart = useCallback(
        (event) => {
            if (!desktopDrawerActive) return
            event.preventDefault()
            if (event.currentTarget.setPointerCapture) {
                event.currentTarget.setPointerCapture(event.pointerId)
            }
            const startWidth = desktopDrawerCollapsed
                ? COLLAPSED_DRAWER_WIDTH
                : DRAWER_WIDTH
            drawerDragRef.current = {
                startX: event.clientX,
                startWidth,
                liveWidth: startWidth,
            }
            setDesktopDrawerWidth(startWidth)
            setDesktopDrawerDragging(true)
        },
        [desktopDrawerActive, desktopDrawerCollapsed],
    )

    const handleDrawerDragMove = useCallback(
        (event) => {
            if (!desktopDrawerDragging) return
            const delta = event.clientX - drawerDragRef.current.startX
            const nextWidth = clamp(
                drawerDragRef.current.startWidth + delta,
                COLLAPSED_DRAWER_WIDTH,
                DRAWER_WIDTH,
            )
            drawerDragRef.current.liveWidth = nextWidth
            setDesktopDrawerWidth(nextWidth)
        },
        [desktopDrawerDragging],
    )

    const handleDrawerDragEnd = useCallback(() => {
        if (!desktopDrawerDragging) return
        const snappedOpen = drawerDragRef.current.liveWidth >= drawerSnapPoint
        setDesktopDrawerCollapsed(!snappedOpen)
        setDesktopDrawerWidth(null)
        setDesktopDrawerDragging(false)
    }, [desktopDrawerDragging, drawerSnapPoint])

    return {
        compact,
        medium,
        railWidth: RAIL_WIDTH,
        drawerWidth: DRAWER_WIDTH,
        collapsedDrawerWidth: COLLAPSED_DRAWER_WIDTH,
        desktopDrawerCollapsed,
        desktopDrawerWidth,
        desktopDrawerDragging,
        desktopDrawerActive,
        drawerCurrentWidth,
        drawerTextReveal,
        drawerIconOnly,
        handleDrawerDragStart,
        handleDrawerDragMove,
        handleDrawerDragEnd,
    }
}
