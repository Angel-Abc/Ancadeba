import { useService } from '@ancadeba/ui'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { useEffect, useRef, useState } from 'react'
import { UI_MESSAGES } from '../messages/ui'
import { IUIReadySignal, uiReadySignalToken } from '../system/uiReadySignal'
import { CORE_MESSAGES } from '../messages/core'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../gameState.ts/provider'
import { domHelperToken, IDomHelper } from '@ancadeba/utils'

export function App() {
  const engineMessageBus = useService<IEngineMessageBus>(engineMessageBusToken)
  const uiReadySignal = useService<IUIReadySignal>(uiReadySignalToken)
  const gameStateProvider = useService<IGameStateProvider>(
    gameStateProviderToken
  )
  const domHelper = useService<IDomHelper>(domHelperToken)
  const signalRef = useRef(false)
  const [isStarted, setIsStarted] = useState<boolean>(false)

  useEffect(() => {
    if (signalRef.current) return
    signalRef.current = true
    uiReadySignal.signalReady()
    engineMessageBus.publish(UI_MESSAGES.UI_INITIALIZED, undefined)
  }, [engineMessageBus, uiReadySignal])

  useEffect(() => {
    return engineMessageBus.subscribe(CORE_MESSAGES.GAME_ENGINE_STARTED, () => {
      setIsStarted(true)
    })
  }, [engineMessageBus])

  if (!isStarted) return <div>loading</div>

  const title = gameStateProvider.state.title as string
  domHelper.setTitle(title)

  return <div>loaded {title}</div>
}
