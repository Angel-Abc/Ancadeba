import { useService } from '@ancadeba/ui'
import { useEffect, useRef, useState } from 'react'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { UI_MESSAGES } from '../messages/ui'
import { CORE_MESSAGES } from '../messages/core'
import { IUIReadySignal, uiReadySignalToken } from '../system/uiReadySignal'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../gameState.ts/provider'
import { domHelperToken, IDomHelper } from '@ancadeba/utils'
import { App } from './App'

export function StartupContainer() {
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

  // TODO: replace direct state access with a typed selector/read model once schema is defined
  const title = isStarted ? (gameStateProvider.state.title as string) : undefined

  useEffect(() => {
    if (!isStarted || !title) return
    domHelper.setTitle(title)
  }, [domHelper, isStarted, title])

  return <App isStarted={isStarted} title={title} />
}
