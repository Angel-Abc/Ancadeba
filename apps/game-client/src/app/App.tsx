import React from 'react'
import { useService } from '@ancadeba/ui'
import { IUIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'

export function App(): React.JSX.Element {
  const uiSignalReady = useService<IUIReadySignal>(uiReadySignalToken)

  React.useEffect(() => {
    // signal that the UI is ready
    uiSignalReady.signalReady()
  }, [uiSignalReady])

  return <div>Game Client App</div>
}
