import { useState } from 'react'
import { useService } from '@ioc/IocProvider'
import { BaseContentProps } from './BaseContent'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { Languages } from '@editor/types/storeItems'
import { Panel } from '../controls/Panel'
import { AiOutlineDelete } from 'react-icons/ai'
import { ButtonBar } from '../controls/ButtonBar'
import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_DEFINITION_UPDATED } from '@editor/messages/editor'

export const LanguagesContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    const messageBus = useService<IMessageBus>(messageBusToken)
    const [languages, setLanguages] = useState<Languages>([...gameDataStoreProvider.retrieve<Languages>(id)])
    const [deleted, setDeleted] = useState<string[]>([])
    const [newLanguage, setNewLanguage] = useState('')

    const addLanguage = (): void => {
        const trimmed = newLanguage.trim()
        if (trimmed === '') {
            return
        }
        if (languages.includes(trimmed)) {
            return
        }
        setDeleted(deleted.filter(l => l !== trimmed))
        const updated = [...languages, trimmed]
        setLanguages(updated)
        setNewLanguage('')
    }

    const removeLanguage = (lan: string): void => {
        setDeleted([...deleted, lan])
        const updated = languages.filter(l => l !== lan)
        setLanguages(updated)
    }

    const onApply = () => {
        const root = gameDataProvider.root
        deleted.forEach(d => delete (root.game.languages[d]))
        languages.forEach(l => {
            if (root.game.languages[l] === undefined) {
                root.game.languages[l] = []
            }
        })
        gameDataStoreProvider.update(root.id, root.game)
        // ensure local state reflects applied changes and clear staging
        setLanguages(Object.keys(root.game.languages).sort())
        setDeleted([])
        setNewLanguage('')
        // notify the tree to refresh based on updated game definition
        messageBus?.postMessage({ message: GAME_DEFINITION_UPDATED })
    }
    const onCancel = () => {
        // reset to canonical game state (may have changed after previous apply)
        const root = gameDataProvider.root
        setLanguages(Object.keys(root.game.languages).sort())
        setDeleted([])
        setNewLanguage('')
    }

    return (
        <>
            <Panel title={label}>
                {languages.map(lan => (
                    <div key={lan} className='languages'>
                        <div className='language'>{lan}</div>
                        <button aria-label={`remove-${lan}`} onClick={() => removeLanguage(lan)}><AiOutlineDelete /></button>
                    </div>
                ))}
                <div className='add-languages'>
                    <input aria-label='new-language' value={newLanguage} onChange={e => setNewLanguage(e.target.value)} />
                    <button onClick={addLanguage}>Add language</button>
                </div>
            </Panel>
            <ButtonBar>
                <button type='button' onClick={() => onApply()}>Apply</button>
                <button type='button' onClick={() => onCancel()}>Cancel</button>
            </ButtonBar>
        </>
    )
}
