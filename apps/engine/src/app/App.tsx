import { useService } from '@angelabc/utils/ioc'
import { IMessageBus, messageBusToken } from '@angelabc/utils/utils'
import { useEffect, useState } from 'react'
import { GameState } from '../core/gameState'
import { gameStateProviderToken, IGameStateProvider } from '../providers/gameStateProvider'
import { MESSAGE_ENGINE_GAME_DATA_LOADED, MESSAGE_ENGINE_STATE_CHANGED } from '../core/messages'
import { GameData } from '../loaders/data/gameData'
import { domHelperToken, IDomHelper } from '@angelabc/utils/utils/domHelper'

export const App: React.FC = (): React.JSX.Element => {
  const messageBus = useService<IMessageBus>(messageBusToken)
  const gameStateProvider = useService<IGameStateProvider>(gameStateProviderToken)
  const domHelper = useService<IDomHelper>(domHelperToken)
  const [gameState, setGameState] = useState<GameState>(gameStateProvider.GameState)
  const [gameData, setGameData] = useState<GameData | null>(null)

  useEffect(() => {
    return messageBus.registerMessageListener(
      MESSAGE_ENGINE_STATE_CHANGED,
      message => setGameState(message.payload as GameState)
    )
  }, [messageBus])

  useEffect(() => {
    return messageBus.registerMessageListener(
      MESSAGE_ENGINE_GAME_DATA_LOADED,
      message => setGameData(message.payload as GameData)
    )
  }, [messageBus])

  useEffect(() => {
    if (gameData) domHelper.setTitle(gameData.name)
  }, [gameData, domHelper])

  switch (gameState) {
    case 'init':
      return <main>initializing...</main>
    case 'loading':
      return <main>loading...</main>
    case 'running':
      return (
        <main>put the game here</main>
      )
  }
}
