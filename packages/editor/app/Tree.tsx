import { GAME_DEFINITION_UPDATED } from '@editor/messages/editor'
import { editTreeProviderToken, GameItemTreeNode, IEditTreeProvider } from '@editor/providers/editTreeProvider'
import { useService } from '@ioc/IocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'
import { TreeNode } from './TreeNode'

export const Tree: React.FC = (): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const editTreeProvider = useService<IEditTreeProvider>(editTreeProviderToken)
    const [root, setRoot] = useState<GameItemTreeNode | null>(null)

    useEffect(() => {
        return messageBus.registerMessageListener(
            GAME_DEFINITION_UPDATED,
            () => setRoot(editTreeProvider.Root)
        )
    }, [messageBus, editTreeProvider])

    return (
        <aside className='side-bar'>
            {root !== null && root.children.length > 0 && (
                <TreeNode node={root} key={root.id} initialCollapse={false}  />
            )}
        </aside>
    )
}
