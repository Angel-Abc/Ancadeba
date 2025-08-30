import { useState } from 'react'
import { BaseContentProps } from './BaseContent'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { useService } from '@ioc/IocProvider'
import { Pages } from '@editor/types/storeItems'
import { Panel } from '../controls/Panel'
import { ButtonBar } from '../controls/ButtonBar'
import { AiOutlineDelete } from 'react-icons/ai'
import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_DEFINITION_UPDATED } from '@editor/messages/editor'

export const PagesContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    const messageBus = useService<IMessageBus>(messageBusToken)
    const [pages, setPages] = useState<Pages>([...gameDataStoreProvider.retrieve<Pages>(id)])
    const [newKey, setNewKey] = useState('')

    const derivePath = (key: string): string => `pages/${key}.json`

    const addPage = (): void => {
        const key = newKey.trim()
        if (key === '') return
        if (pages.some(p => p.key.toLowerCase() === key.toLowerCase())) return
        const updated = [...pages, { key, path: derivePath(key) }]
        updated.sort((a, b) => a.key.localeCompare(b.key))
        setPages(updated)
        setNewKey('')
    }

    const removePage = (key: string): void => {
        const updated = pages.filter(p => p.key !== key)
        setPages(updated)
    }

    const onApply = (): void => {
        const root = gameDataProvider.root
        const newPages: Record<string, string> = {}
        pages.forEach(p => { newPages[p.key] = p.path })
        root.game.pages = newPages
        gameDataStoreProvider.update(root.id, root.game)
        // reset local state from canonical and clear inputs
        const canonical: Pages = Object.keys(root.game.pages).sort().map(k => ({ key: k, path: root.game.pages[k] }))
        setPages(canonical)
        setNewKey('')
        messageBus?.postMessage({ message: GAME_DEFINITION_UPDATED })
    }

    const onCancel = (): void => {
        const root = gameDataProvider.root
        const canonical: Pages = Object.keys(root.game.pages).sort().map(k => ({ key: k, path: root.game.pages[k] }))
        setPages(canonical)
        setNewKey('')
    }

    return (
        <>
            <Panel title={label}>
                {pages.map(p => (
                    <div key={p.key} className='pages'>
                        <div className='page-key'>{p.key}</div>
                        <button aria-label={`remove-${p.key}`} onClick={() => removePage(p.key)}><AiOutlineDelete /></button>
                        <div className='page-path'>{p.path}</div>
                    </div>
                ))}
                <div className='add-pages'>
                    <input aria-label='new-page-key' value={newKey} onChange={e => setNewKey(e.target.value)} />
                    <button onClick={addPage}>Add page</button>
                </div>
            </Panel>
            <ButtonBar>
                <button type='button' onClick={() => onApply()}>Apply</button>
                <button type='button' onClick={() => onCancel()}>Cancel</button>
            </ButtonBar>
        </>
    )
}
