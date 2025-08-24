import { GameItemTreeNode } from '@editor/providers/editTreeProvider'
import { AiTwotoneFolder, AiTwotoneFolderOpen } from 'react-icons/ai'
import { useState } from 'react'
import { useService } from '@ioc/IocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'
import { SetEditorContentPayload } from '@editor/messages/types'
import { BaseItemType } from '@editor/types/gameItems'

interface TreeNodeProps {
    node: GameItemTreeNode
    initialCollapse?: boolean
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, initialCollapse }): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapse === undefined ? true : initialCollapse)
    const hasChildren = node.children.length > 0
    const icon = hasChildren ? (isCollapsed ? <AiTwotoneFolder /> : <AiTwotoneFolderOpen />) : undefined

    const toggle = (): void => {
        if (!hasChildren) return
        setIsCollapsed(!isCollapsed)
    }

    const select = (): void => {
        const payload: SetEditorContentPayload = {
            id: node.id,
            label: node.label,
            type: node.data ? node.data.type as BaseItemType : null 
        }
        messageBus.postMessage({
            message: SET_EDITOR_CONTENT,
            payload: payload
        })
    }

    return (
        <div>
            <label><span onClick={toggle}>{icon}</span> <span onClick={select}>{node.label}</span></label>
            {!isCollapsed && hasChildren && (
                <div className='children'>
                    {node.children.map(child => <TreeNode node={child} key={child.id} />)}
                </div>
            )}
        </div>
    )
}
