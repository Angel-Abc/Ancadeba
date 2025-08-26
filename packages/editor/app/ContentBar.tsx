import { GAME_DATA_STORE_CHANGED } from '@editor/messages/editor'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { useService } from '@ioc/IocProvider'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'

const logName = 'ContentBar'
export const ContentBar: React.FC = (): React.JSX.Element => {
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const logger = useService<ILogger>(loggerToken)
    const messageBus = useService<IMessageBus>(messageBusToken)
    const [isChanged, setIsChanged] = useState<boolean>(gameDataStoreProvider.IsChanged)
    const onSaveClicked = async (): Promise<void> => {
        const items = gameDataStoreProvider.getChangedItems()
        try {
            await Promise.all(
                items.map(item =>
                    fetch(`/data/${item.path}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.data)
                    })
                )
            )
            gameDataStoreProvider.markSaved()
            setIsChanged(false)
            messageBus.postMessage({ message: GAME_DATA_STORE_CHANGED })
        } catch (err) {
            logger.warn(logName, 'Error saving changes: {0}', err)
        }
    }

    useEffect(() => {
        return messageBus.registerMessageListener(
            GAME_DATA_STORE_CHANGED,
            () => setIsChanged(gameDataStoreProvider.IsChanged)
        )
    }, [gameDataStoreProvider, messageBus])

    return (
        <header className='content-bar'>
            <span/>
            <span className='notify'>
            {isChanged ? 'There are pending changes waiting to be saved.' : ''}
            </span>
            <button
                type='button'
                disabled={!isChanged}
                onClick={onSaveClicked}
            >
                Save
            </button>
        </header>
    )
}
