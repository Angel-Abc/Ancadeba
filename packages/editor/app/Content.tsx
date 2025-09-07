import { useEffect, useState } from 'react'
import { useService } from '@ioc/IocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { SHOW_GAME_META } from '@editor/messages/editor'
import { GameMetaForm } from './forms/GameMetaForm'

type ContentView = 'game-meta'

export const Content: React.FC = (): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const [view, setView] = useState<ContentView>('game-meta')

    useEffect(() => {
        // Default to game meta on initial load
        setView('game-meta')
        // Listen for explicit requests to show game metadata editor
        return messageBus.registerMessageListener(SHOW_GAME_META, () => setView('game-meta'))
    }, [messageBus])

    return (
        <div className='content'>
            {view === 'game-meta' && <GameMetaForm />}
        </div>
    )
}
