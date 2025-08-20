import { GAME_DEFINITION_UPDATED } from '@editor/messages/editor'
import { editTreeProviderToken, GameItemTreeNode, IEditTreeProvider } from '@editor/providers/editTreeProvider'
import { useService } from '@ioc/iocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'
import { TreeNode } from './treeNode'

export const Tree: React.FC = (): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const editTreeProvider = useService<IEditTreeProvider>(editTreeProviderToken)
    const [root, setRoot] = useState<GameItemTreeNode>(editTreeProvider.Root)
    
    useEffect(() => {
        return messageBus.registerMessageListener(
            GAME_DEFINITION_UPDATED, 
            () => setRoot(editTreeProvider.Root)
        )
    }, [ messageBus, editTreeProvider])

    return (
        <aside className='side-bar'>
            <TreeNode node={root} />
        </aside>
    )
}
