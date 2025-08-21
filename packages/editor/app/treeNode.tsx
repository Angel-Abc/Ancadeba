import { GameItemTreeNode } from '@editor/providers/editTreeProvider'
import { AiTwotoneFolder, AiTwotoneFolderOpen } from 'react-icons/ai'
import { useState } from 'react'
import { useService } from '@ioc/iocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'

interface TreeNodeProps {
    node: GameItemTreeNode
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node }): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(node.isCollapsed)
    const hasChildren = node.children.length > 0
    const icon = hasChildren ? (isCollapsed ? <AiTwotoneFolder /> : <AiTwotoneFolderOpen />) : undefined

    const toggle = (): void => {
        if (!hasChildren) return
        const newValue = !isCollapsed
        node.isCollapsed = newValue
        setIsCollapsed(newValue)
    }

    const select = (): void => {
        messageBus.postMessage({
            message: SET_EDITOR_CONTENT,
            payload: {
                label: node.label,
                level: node.level,
                data: node.data
            }
        })
    }

    return (
        <div>
            <label><span onClick={toggle}>{icon}</span> <span onClick={select}>{node.label}</span></label>
            {!isCollapsed && hasChildren && (
                <div className='children'>
                    {node.children.map(child => <TreeNode node={child} key={child.data?.id ?? child.label} />)}
                </div>
            )}
        </div>
    )
}
