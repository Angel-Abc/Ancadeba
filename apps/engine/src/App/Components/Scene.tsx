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

export function Scene() {
  var resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  var gameStateProvider = useService<IGameStateProvider>(gameStateProviderToken)
  var activeScene = resourceDataProvider.getSceneData(
    gameStateProvider.state.activeScene
  )

  switch (activeScene.screen.type) {
    case 'grid': {
      return <GridScreen screen={activeScene.screen} />
    }
    default:
      return <div>Unknown Scene Screen Type: {activeScene.screen.type}</div>
  }
}
