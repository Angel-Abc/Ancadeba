import { GameItemTreeNode } from '@editor/providers/editTreeProvider'
import { AiTwotoneFolder, AiTwotoneFolderOpen } from 'react-icons/ai'
import { useState } from 'react'

interface TreeNodeProps {
    node: GameItemTreeNode
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node }): React.JSX.Element => {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(node.isCollapsed)
    const icon = isCollapsed ? <AiTwotoneFolder /> : <AiTwotoneFolderOpen />

    const toggle = (): void => {
        if (node.children.length === 0) return
        const newValue = !isCollapsed
        node.isCollapsed = newValue
        setIsCollapsed(newValue)
    }

    return (
        <div>
            <label onClick={toggle}>{icon} {node.label}</label>
            {!isCollapsed && node.children.length > 0 && (
                <div className='children'>
                    {node.children.map(child => <TreeNode node={child} key={child.label} />)}
                </div>
            )}
        </div>
    )
}
