import { GAME_DEFINITION_UPDATED } from '@editor/messages/editor'
import { editTreeProviderToken, GameItemTreeNode, IEditTreeProvider } from '@editor/providers/editTreeProvider'
import { useService } from '@ioc/IocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { TreeNode } from './TreeNode'
import { AiOutlineDoubleLeft, AiOutlineDoubleRight } from 'react-icons/ai'

interface TreeProps {
    collapsed: boolean
    onToggleSidebar: () => void
}

export const Tree: React.FC<TreeProps> = ({ collapsed, onToggleSidebar }): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const editTreeProvider = useService<IEditTreeProvider>(editTreeProviderToken)
    const [root, setRoot] = useState<GameItemTreeNode | null>(null)
    const icon = collapsed ? <AiOutlineDoubleRight /> : <AiOutlineDoubleLeft />
    useEffect(() => {
        return messageBus.registerMessageListener(
            GAME_DEFINITION_UPDATED,
            () => setRoot(editTreeProvider.Root)
        )
    }, [messageBus, editTreeProvider])

    return (
        <aside className={classNames('side-bar', { collapsed })}>
            {!collapsed && root !== null && root.children.length > 0 && (
                <TreeNode node={root} key={root.id} initialCollapse={false} />
            )}
            <button type='button' onClick={onToggleSidebar} className='toggle-collapse'>{icon}</button>
        </aside>
    )
}
