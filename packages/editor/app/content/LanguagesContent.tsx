import { useService } from '@ioc/IocProvider'
import { BaseContentProps } from './BaseContent'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { Languages } from '@editor/types/storeItems'
import { Panel } from '../controls/Panel'

export const LanguagesContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const languages = gameDataStoreProvider.retrieve<Languages>(id)
    return (
        <Panel title={label}>
            {languages.map(lan => (
                <div>{lan}</div>
            ))}
        </Panel>
    )
}
