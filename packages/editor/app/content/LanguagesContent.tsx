import { useState } from 'react'
import { useService } from '@ioc/IocProvider'
import { BaseContentProps } from './BaseContent'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { Languages } from '@editor/types/storeItems'
import { Panel } from '../controls/Panel'
import { AiOutlineDelete } from 'react-icons/ai'
import { ButtonBar } from '../controls/ButtonBar'
import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'

export const LanguagesContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
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
        deleted.forEach(d => delete(root.game.languages[d]))
        languages.forEach(l => {
            if (root.game.languages[l] === undefined){
                root.game.languages[l] = []
            }
        })
        gameDataStoreProvider.update(root.id, root.game)
        // TODO: update the tree
    }
    const onCancel = () => {
        setLanguages([...gameDataStoreProvider.retrieve<Languages>(id)])
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
