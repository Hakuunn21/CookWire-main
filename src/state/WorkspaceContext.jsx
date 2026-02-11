/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useReducer } from 'react'
import { DEFAULT_STATE, workspaceReducer } from './workspaceReducer'

const WorkspaceStateContext = createContext(null)
const WorkspaceDispatchContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(workspaceReducer, DEFAULT_STATE)

  const stateValue = useMemo(() => state, [state])

  return (
    <WorkspaceStateContext.Provider value={stateValue}>
      <WorkspaceDispatchContext.Provider value={dispatch}>{children}</WorkspaceDispatchContext.Provider>
    </WorkspaceStateContext.Provider>
  )
}

export function useWorkspaceState() {
  const context = useContext(WorkspaceStateContext)
  if (!context) {
    throw new Error('useWorkspaceState must be used within WorkspaceProvider')
  }
  return context
}

export function useWorkspaceDispatch() {
  const context = useContext(WorkspaceDispatchContext)
  if (!context) {
    throw new Error('useWorkspaceDispatch must be used within WorkspaceProvider')
  }
  return context
}
