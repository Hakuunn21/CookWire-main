import {
  Box,
  Chip,
  IconButton,
  Typography,
} from '@mui/material'
import {
  DeleteOutlineRounded,
  ErrorOutlineRounded,
  WarningAmberRounded,
  InfoOutlined,
  ExpandLessRounded,
  ExpandMoreRounded,
} from '@mui/icons-material'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

const LOG_COLORS = {
  log: 'text.secondary',
  info: 'info.main',
  warn: 'warning.main',
  error: 'error.main',
}

const LOG_ICONS = {
  warn: <WarningAmberRounded sx={{ fontSize: 14 }} />,
  error: <ErrorOutlineRounded sx={{ fontSize: 14 }} />,
  info: <InfoOutlined sx={{ fontSize: 14 }} />,
}

const MobileConsolePanel = memo(function MobileConsolePanel({
  open,
  onToggle,
  t,
}) {
  const [logs, setLogs] = useState([])
  const scrollRef = useRef(null)
  const idRef = useRef(0)

  const handleMessage = useCallback((event) => {
    if (event.data?.type === 'console') {
      const { method, args } = event.data
      if (['log', 'info', 'warn', 'error'].includes(method)) {
        setLogs((prev) => [
          ...prev.slice(-200),
          {
            id: ++idRef.current,
            method,
            text: args.map((a) =>
              typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a),
            ).join(' '),
            timestamp: Date.now(),
          },
        ])
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, open])

  const handleClear = useCallback(() => setLogs([]), [])

  const errorCount = logs.filter((l) => l.method === 'error').length
  const warnCount = logs.filter((l) => l.method === 'warn').length

  return (
    <Box
      sx={(theme) => ({
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.custom.workspaceCanvas,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'height 220ms cubic-bezier(0.2, 0, 0, 1)',
        height: open ? 160 : 36,
        flexShrink: 0,
      })}
    >
      {/* Console status bar */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          minHeight: 36,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Typography
          variant="labelMedium"
          sx={{ fontWeight: 700, mr: 0.5 }}
        >
          {t('console')}
        </Typography>

        {errorCount > 0 && (
          <Chip
            icon={<ErrorOutlineRounded sx={{ fontSize: 14 }} />}
            label={errorCount}
            size="small"
            color="error"
            variant="outlined"
            sx={{ height: 22, '& .MuiChip-label': { px: 0.5, fontSize: 11 } }}
          />
        )}
        {warnCount > 0 && (
          <Chip
            icon={<WarningAmberRounded sx={{ fontSize: 14 }} />}
            label={warnCount}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ height: 22, '& .MuiChip-label': { px: 0.5, fontSize: 11 } }}
          />
        )}

        <Box sx={{ flex: 1 }} />

        {open && (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleClear() }}
            aria-label={t('consoleClear')}
            sx={{ p: 0.5 }}
          >
            <DeleteOutlineRounded sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <IconButton size="small" sx={{ p: 0.5 }}>
          {open ? (
            <ExpandMoreRounded sx={{ fontSize: 18 }} />
          ) : (
            <ExpandLessRounded sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Box>

      {/* Console output */}
      {open && (
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 1.5,
            pb: 1,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {logs.length === 0 ? (
            <Typography variant="labelSmall" color="text.secondary" sx={{ py: 1 }}>
              {t('consoleEmpty')}
            </Typography>
          ) : (
            logs.map((entry) => (
              <Box
                key={entry.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  py: 0.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {LOG_ICONS[entry.method] && (
                  <Box sx={{ color: LOG_COLORS[entry.method], mt: 0.25 }}>
                    {LOG_ICONS[entry.method]}
                  </Box>
                )}
                <Typography
                  variant="labelSmall"
                  sx={{
                    color: LOG_COLORS[entry.method],
                    fontFamily: 'monospace',
                    fontSize: 11,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.5,
                  }}
                >
                  {entry.text}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  )
})

export default MobileConsolePanel
