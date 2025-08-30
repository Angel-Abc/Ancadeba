import { useMemo, useState } from 'react'
import { BaseContentProps } from './BaseContent'
import { Panel } from '../controls/Panel'
import { ButtonBar } from '../controls/ButtonBar'
import { useService } from '@ioc/IocProvider'
import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_DEFINITION_UPDATED } from '@editor/messages/editor'
import { AiOutlineDelete } from 'react-icons/ai'
import { ITranslationsPathValidator, translationsPathValidatorToken } from './validators/translationsPathValidator'

export const LanguageContent: React.FC<BaseContentProps> = ({ label }): React.JSX.Element => {
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const messageBus = useService<IMessageBus>(messageBusToken)
    const validator = useService<ITranslationsPathValidator>(translationsPathValidatorToken)

    // language code is the label for this node
    const languageCode = label
    const originalList = useMemo(() => (gameDataProvider.root.game.languages[languageCode] ?? []).slice(), [gameDataProvider, languageCode])
    const [paths, setPaths] = useState<string[]>(originalList)
    const [newPath, setNewPath] = useState<string>('')

    const pathError: string | null = (() => {
        const p = newPath.trim()
        if (p.length === 0) return null
        if (!validator.isValidPath(p)) return 'Path must be a .json file'
        if (validator.isDuplicatePath(p, paths)) return 'Path already exists'
        return null
    })()

    const addPath = (): void => {
        const p = newPath.trim()
        if (pathError !== null || p === '') return
        setPaths([...paths, p])
        setNewPath('')
    }

    const removePath = (p: string): void => {
        setPaths(paths.filter(x => x !== p))
    }

    const onApply = (): void => {
        const root = gameDataProvider.root
        root.game.languages[languageCode] = paths.slice()
        gameDataStoreProvider.update(root.id, root.game)
        // refresh tree to reflect translations nodes change
        messageBus?.postMessage({ message: GAME_DEFINITION_UPDATED })
    }

    const onCancel = (): void => {
        const current = (gameDataProvider.root.game.languages[languageCode] ?? []).slice()
        setPaths(current)
        setNewPath('')
    }

    return (
        <>
            <Panel title={`Language: ${languageCode}`}>
                {paths.map(p => (
                    <div key={p} className='language-files'>
                        <div className='language-file-path'>{p}</div>
                        <button aria-label={`remove-${p}`} onClick={() => removePath(p)}><AiOutlineDelete /></button>
                    </div>
                ))}
                <div className='add-language-file'>
                    <input aria-label='new-language-file' value={newPath} onChange={e => setNewPath(e.target.value)} />
                    <button disabled={pathError !== null} onClick={addPath}>Add file</button>
                </div>
                {pathError && <div className='validation-error' role='alert'>{pathError}</div>}
            </Panel>
            <ButtonBar>
                <button type='button' disabled={pathError !== null} onClick={() => onApply()}>Apply</button>
                <button type='button' onClick={() => onCancel()}>Cancel</button>
            </ButtonBar>
        </>
    )
}
