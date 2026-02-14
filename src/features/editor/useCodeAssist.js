import { useCallback } from 'react'

export function useCodeAssist(value, onUpdate, inputRef) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === '>') {
      const { selectionStart, selectionEnd } = e.target
      
      // Basic check: Only text selection (no range)
      if (selectionStart !== selectionEnd) return

      const textBefore = value.substring(0, selectionStart)
      
      // Match explicit opening tag pattern: <tag
      // \w+ matches standard tag names.
      // We ensure it starts with < and has no spaces.
      const match = textBefore.match(/<(\w+)$/)
      
      if (match) {
        // Prevent default '>' insertion
        e.preventDefault()
        
        const tagName = match[1]
        const closingTag = `</${tagName}>`
        const newValue = value.substring(0, selectionStart) + '>' + closingTag + value.substring(selectionEnd)
        
        onUpdate(newValue)
        
        // Restore cursor position to be *inside* the tag
        // <tag|> -> <tag>|</tag>
        // position = selectionStart + 1 (length of '>')
        const newCursorPos = selectionStart + 1
        
        // Use setTimeout to ensure state update has likely processed or at least to queue it after standard event loop
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = newCursorPos
            inputRef.current.selectionEnd = newCursorPos
          }
        }, 0)
      }
    }
  }, [value, onUpdate, inputRef])

  return handleKeyDown
}
