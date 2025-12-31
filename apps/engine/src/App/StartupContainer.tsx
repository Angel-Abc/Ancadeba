import { domHelperToken, IDomHelper, useService } from '@ancadeba/ui'
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
import { App } from './App'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../resourceData/provider'

export function StartupContainer() {
  const engineMessageBus = useService<IEngineMessageBus>(engineMessageBusToken)
  const uiReadySignal = useService<IUIReadySignal>(uiReadySignalToken)
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
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

  const title = gameStateProvider.gameTitle
  const cssFilePaths = resourceDataProvider.getCssFilePaths()

  useEffect(() => {
    if (!isStarted || !title) return
    domHelper.setTitle(title)
    cssFilePaths.forEach((path) => domHelper.addCssFile(path))
  }, [domHelper, isStarted, title, cssFilePaths])

  return <App isStarted={isStarted} />
}
