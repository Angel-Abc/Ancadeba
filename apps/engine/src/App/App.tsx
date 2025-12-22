import { useService } from '@ancadeba/ui'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { useEffect, useRef } from 'react'
import { UI_MESSAGES } from '../messages/ui'
import { IUIReadySignal, uiReadySignalToken } from '../system/uiReadySignal'

export function App() {
  const engineMessageBus = useService<IEngineMessageBus>(engineMessageBusToken)
  const uiReadySignal = useService<IUIReadySignal>(uiReadySignalToken)
  const signalRef = useRef(false)

  useEffect(() => {
    if (signalRef.current) return
    signalRef.current = true
    uiReadySignal.signalReady()
    engineMessageBus.publish(UI_MESSAGES.UI_INITIALIZED, undefined)
  }, [engineMessageBus, uiReadySignal])

  return 'Hello from Engine App!'
}
