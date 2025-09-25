import { useService } from '@angelabc/utils/ioc'
import { IMessageBus, messageBusToken } from '@angelabc/utils/utils'
import { useEffect, useState } from 'react'
import { GameState } from '../core/gameState'
import { gameStateProviderToken, IGameStateProvider } from '../providers/gameStateProvider'
import { MESSAGE_ENGINE_STATE_CHANGED } from '../core/messages'

export const App: React.FC = (): React.JSX.Element => {
  const messageBus = useService<IMessageBus>(messageBusToken)
  const gameStateProvider = useService<IGameStateProvider>(gameStateProviderToken)
  const [gameState, setGameState] = useState<GameState>(gameStateProvider.GameState)

  useEffect(() => {
    return messageBus.registerMessageListener(
      MESSAGE_ENGINE_STATE_CHANGED,
      message => setGameState(message.payload as GameState)
    )
  }, [messageBus])

  return (
    <main>Ancadeba Engine ({gameState})</main>
  )
}
