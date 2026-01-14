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
import { assertNever, ILogger, loggerToken } from '@ancadeba/utils'

export function Scene() {
  const logName = 'App.Controls.Scene'
  const logger = useService<ILogger>(loggerToken)
  const gameStateProvider = useService<IGameStateProvider>(
    gameStateProviderToken
  )
  const [activeSceneId, setActiveSceneId] = useState<string>(
    gameStateProvider.activeSceneId
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

  const resolvedComponents = useMemo(
    () =>
      activeScene.components.map((c) =>
        resourceDataProvider.resolveComponent(c)
      ),
    [activeScene.components, resourceDataProvider]
  )

  switch (activeScene.screen.type) {
    case 'grid': {
      return (
        <GridScreen
          screen={activeScene.screen}
          components={resolvedComponents}
          sceneId={activeScene.id}
        />
      )
    }
    default: {
      logger.warn(
        logName,
        'Unknown screen type: {0}',
        (activeScene as SceneData).screen.type
      )
      return assertNever(activeScene.screen.type)
    }
  }
}
