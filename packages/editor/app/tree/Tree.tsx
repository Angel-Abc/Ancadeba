import { useMemo } from 'react'
import { useService } from '@ioc/IocProvider'
import { gameModelToken, IGameModel } from '@editor/model/GameModel'
import { ILanguagesModel, languagesModelToken } from '@editor/model/LanguagesModel'
import { Node } from  './Node'
import { TreeNode } from './types'

export const Tree: React.FC = (): React.JSX.Element => {
    const gameModel = useService<IGameModel>(gameModelToken)
    const languagesModel = useService<ILanguagesModel>(languagesModelToken)

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
            onClick: () => {},
            children: [languagesRoot]
        }
    }, [gameModel.title, languagesModel.languages])

    return (
        <div className='tree'>
            <Node node={root} />
        </div>
    )
}
