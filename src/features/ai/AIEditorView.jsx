import {
  Box,
  Container,
  IconButton,
  InputBase,
  Typography,
  Avatar,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  useTheme,
  Button
} from '@mui/material'
import { SendRounded, AutoAwesomeRounded, PersonRounded, ArrowBackRounded } from '@mui/icons-material'
// import { useChat } from '@ai-sdk/react'
import { useChat } from '@ai-sdk/react'
import { getOwnerKey } from '../../utils/ownerKey'
import { useEffect, useRef, useState } from 'react'

// Local mock to restore UI
// function useChatMock() {
//   const [messages, setMessages] = useState([])
//   const [input, setInput] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
// 
//   const handleInputChange = (e) => setInput(e.target.value)
// 
//   const handleSubmit = async (e, overrideInput) => {
//     if (e && e.preventDefault) e.preventDefault()
//     const text = overrideInput || input
//     if (!text.trim()) return
// 
//     const userMsg = { id: Date.now().toString(), role: 'user', content: text }
//     setMessages(prev => [...prev, userMsg])
//     setInput('')
//     setIsLoading(true)
// 
//     setTimeout(() => {
//       const aiMsg = {
//         id: (Date.now() + 1).toString(),
//         role: 'assistant',
//         content: "I am running in local mock mode to prevent the white screen error. The Vercel AI SDK integration is being debugged."
//       }
//       setMessages(prev => [...prev, aiMsg])
//       setIsLoading(false)
//     }, 1000)
//   }
// 
//   return { messages, input, setInput, handleInputChange, handleSubmit, isLoading }
// }

function ChatMessage({ role, content }) {
  const theme = useTheme()
  const isAI = role === 'assistant'
  const isDark = theme.palette.mode === 'dark'

  // M3 Colors (approximate based on theme or hardcoded standard tokens if theme lacks them)
  const userBg = isDark ? '#00468a' : '#d6e3ff' // Primary Container
  const userColor = isDark ? '#d6e3ff' : '#001b3e' // On Primary Container
  const aiBg = isDark ? '#3e4759' : '#f2f0f4' // Surface Container High / Secondary Container
  const aiColor = isDark ? '#e2e2e6' : '#1a1c1e' // On Surface

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isAI ? 'row' : 'row-reverse',
        gap: 1.5,
        py: 2,
        px: { xs: 2, md: 0 },
        alignItems: 'flex-end',
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: isAI ? 'primary.main' : 'secondary.main',
          mb: 0.5,
        }}
      >
        {isAI ? <AutoAwesomeRounded sx={{ fontSize: 16 }} /> : <PersonRounded sx={{ fontSize: 16 }} />}
      </Avatar>

      {/* Message Bubble */}
      <Box sx={{ maxWidth: '75%' }}>
        {/* Name Label (Optional, maybe skip for cleaner chat) */}
        <Typography
          variant="labelSmall"
          sx={{
            display: 'block',
            mb: 0.5,
            ml: isAI ? 1.5 : 0,
            mr: isAI ? 0 : 1.5,
            textAlign: isAI ? 'left' : 'right',
            color: 'text.secondary',
            opacity: 0.8
          }}
        >
          {isAI ? 'CookWire AI' : 'You'}
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: isAI ? aiBg : userBg,
            color: isAI ? aiColor : userColor,
            borderRadius: isAI ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
          }}
        >
          <Typography
            variant="bodyLarge"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              fontSize: '0.95rem',
            }}
          >
            {content}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

const SUGGESTIONS = [
  "Create a landing page for a coffee shop",
  "Build a login form with validation",
  "Design a pricing table with 3 tiers",
  "Make a responsive navigation bar"
]

export default function AIEditorView({ onApply, currentUser, onLogin, t, onBack }) {
  // Custom input handling to fix "undefined" input error from useChat
  const [inputValue, setInputValue] = useState('')
  const { messages, append, isLoading } = useChat({
    api: '/api/chat',
    headers: {
      'x-cookwire-owner-key': getOwnerKey(),
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })
  const messagesEndRef = useRef(null)
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!inputValue.trim()) return

    await append({
      role: 'user',
      content: inputValue
    })
    setInputValue('')
  }

  const handleSuggestionClick = (text) => {
    setInputValue(text)
  }

  if (!currentUser) {
    return (
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}>
        {/* Header with Back Button */}
        <Box sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {onBack && (
            <IconButton onClick={onBack} size="small">
              <ArrowBackRounded />
            </IconButton>
          )}
          <Typography variant="titleMedium" fontWeight="500">
            With AI
          </Typography>
        </Box>

        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 3,
          p: 2
        }}>
          <AutoAwesomeRounded sx={{ fontSize: 48, color: 'primary.main', opacity: 0.8 }} />
          <Box>
            <Typography variant="titleMedium" fontWeight="700" gutterBottom>
              Login Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('aiLoginRequired')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={onLogin}
            startIcon={<PersonRounded />}
            sx={{ borderRadius: 8, px: 3, py: 1, textTransform: 'none' }}
          >
            {t('loginOrSignup')}
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>

      {/* Header with Back Button */}
      <Box sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper' // Ensure header stands out slightly or matches generic sidebar bg
      }}>
        {onBack && (
          <IconButton onClick={onBack} size="small">
            <ArrowBackRounded />
          </IconButton>
        )}
        <Typography variant="titleMedium" fontWeight="500">
          CookWire AI
        </Typography>
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', pb: 8, px: 2 }}>
            <Typography variant="bodyMedium" color="text.secondary" sx={{ opacity: 0.7, textAlign: 'center' }}>
              How can I help you?
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 2, px: 2, flex: 1 }}>
            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} content={m.content} />
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', gap: 2, py: 2, alignItems: 'center' }}>
                <CircularProgress size={16} />
                <Typography variant="bodySmall" color="text.secondary">Thinking...</Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 1.5, pb: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Paper
          elevation={0}
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 24, // Pill shape
            bgcolor: isDark ? '#2e3135' : '#f0f2f5', // Surface Container High
            border: '1px solid',
            borderColor: 'transparent',
            transition: 'box-shadow 0.2s',
            '&:focus-within': {
              boxShadow: theme.shadows[2]
            }
          }}
        >
          <InputBase
            sx={{ ml: 2, flex: 1, py: 1, fontSize: '0.95rem' }}
            placeholder="Ask AI..."
            value={inputValue}
            onChange={handleInputChange}
            multiline
            maxRows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <IconButton
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            color="primary"
            size="small"
            sx={{
              p: 0.75, // Reduced padding
              mr: 0.75, // Adjusted margin to be more symmetrical with the rounded end
              transition: 'all 0.2s',
              opacity: (!inputValue.trim() || isLoading) ? 0.4 : 1,
              bgcolor: inputValue.trim() ? 'primary.main' : 'transparent',
              color: inputValue.trim() ? 'primary.contrastText' : 'text.disabled',
              '&:hover': {
                bgcolor: inputValue.trim() ? 'primary.dark' : 'transparent',
              },
              // Ensure it's a perfect circle and centered
              width: 32,
              height: 32,
            }}
          >
            <SendRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  )
}

