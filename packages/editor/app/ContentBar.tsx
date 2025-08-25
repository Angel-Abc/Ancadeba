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
    const onSaveClicked = (): void => {
        logger.warn(logName, 'Not implemented yet')
    }

    useEffect(() => {
        return messageBus.registerMessageListener(
            GAME_DATA_STORE_CHANGED,
            () => setIsChanged(gameDataStoreProvider.IsChanged)
        )
    }, [gameDataStoreProvider, messageBus])

    return (
        <header className='content-bar'>
            <span />
            <span className='notify'>
            {isChanged ? 'There are pending changes waiting to be saved.' : ''}
            </span>
            <button
                type='button'
                disabled={!isChanged}
                onClick={() => onSaveClicked}
            >
                Save
            </button>
        </header>
    )
}
