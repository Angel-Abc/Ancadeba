import { useState } from 'react'
import { useService } from '@ioc/IocProvider'
import { BaseContentProps } from './BaseContent'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { Languages } from '@editor/types/storeItems'
import { Panel } from '../controls/Panel'

export const LanguagesContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const [languages, setLanguages] = useState<Languages>(() => [...gameDataStoreProvider.retrieve<Languages>(id)])
    const [newLanguage, setNewLanguage] = useState('')

    const addLanguage = (): void => {
        const trimmed = newLanguage.trim()
        if (trimmed === '' || languages.includes(trimmed)) {
            return
        }
        const updated = [...languages, trimmed]
        setLanguages(updated)
        setNewLanguage('')
        gameDataStoreProvider.update(id, updated)
    }

    const removeLanguage = (lan: string): void => {
        const updated = languages.filter(l => l !== lan)
        setLanguages(updated)
        gameDataStoreProvider.update(id, updated)
    }

    return (
        <Panel title={label}>
            {languages.map(lan => (
                <div key={lan}>
                    {lan}
                    <button aria-label={`remove-${lan}`} onClick={() => removeLanguage(lan)}>Remove</button>
                </div>
            ))}
            <input aria-label='new-language' value={newLanguage} onChange={e => setNewLanguage(e.target.value)} />
            <button onClick={addLanguage}>Add language</button>
        </Panel>
    )
}
