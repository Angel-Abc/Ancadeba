import { useEffect, useMemo, useState } from 'react'
import { useService } from '@ioc/IocProvider'
import { gameModelToken, IGameModel } from '@editor/model/GameModel'
import { ILanguagesModel, languagesModelToken } from '@editor/model/LanguagesModel'
import { Node } from  './Node'
import { TreeNode } from './types'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_META_UPDATED, SHOW_GAME_META } from '@editor/messages/editor'

export const Tree: React.FC = (): React.JSX.Element => {
    const gameModel = useService<IGameModel>(gameModelToken)
    const languagesModel = useService<ILanguagesModel>(languagesModelToken)
    const messageBus = useService<IMessageBus>(messageBusToken)
    const [refresh, setRefresh] = useState(0)

    useEffect(() => {
        return messageBus.registerMessageListener(GAME_META_UPDATED, () => setRefresh(r => r + 1))
    }, [messageBus])

    const root = useMemo<TreeNode>(() => {
        let key = 0
        const nextKey = () => ++key

        const languageNodes: TreeNode[] = languagesModel.languages.map(lang => {
            const fileNodes: TreeNode[] = lang.translations.map(t => {
                const parts = t.file.split('/')
                const fileName = parts[parts.length - 1]
                return {
                    key: nextKey(),
                    label: fileName,
                    onClick: () => {},
                    children: []
                }
            })

            return {
                key: nextKey(),
                label: lang.language,
                onClick: () => {},
                children: fileNodes
            }
        })

        const languagesRoot: TreeNode = {
            key: nextKey(),
            label: 'languages',
            onClick: () => {},
            children: languageNodes
        }

        return {
            key: nextKey(),
            label: gameModel.title,
            onClick: () => messageBus.postMessage({ message: SHOW_GAME_META, payload: null }),
            children: [languagesRoot]
        }
    }, [gameModel.title, languagesModel.languages, messageBus, refresh])

    return (
        <ul className='tree'>
            <Node node={root} />
        </ul>
    )
}
