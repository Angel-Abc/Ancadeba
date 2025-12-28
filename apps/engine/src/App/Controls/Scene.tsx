import { useService } from '@ancadeba/ui'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../resourceData/provider'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../../gameState.ts/provider'
import { GridScreen } from './GridScreen'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../../system/engineMessageBus'
import { CORE_MESSAGES } from '../../messages/core'
import { useEffect, useMemo, useState } from 'react'
import { Scene as SceneData } from '@ancadeba/schemas'

export function Scene() {
  const gameStateProvider = useService<IGameStateProvider>(
    gameStateProviderToken
  )
  const [activeSceneId, setActiveSceneId] = useState<string>(
    gameStateProvider.state.activeScene
  )
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const engineMessageBus = useService<IEngineMessageBus>(engineMessageBusToken)

  useEffect(() => {
    return engineMessageBus.subscribe(
      CORE_MESSAGES.SCENE_CHANGED,
      (payload) => {
        setActiveSceneId(payload.sceneId)
      }
    )
  }, [engineMessageBus])

  const activeScene = useMemo<SceneData>(
    () => resourceDataProvider.getSceneData(activeSceneId),
    [activeSceneId, resourceDataProvider]
  )

  switch (activeScene.screen.type) {
    case 'grid': {
      return (
        <GridScreen
          screen={activeScene.screen}
          components={activeScene.components}
        />
      )
    }
    default:
      return <div>Unknown Scene Screen Type: {activeScene.screen.type}</div>
  }
}
