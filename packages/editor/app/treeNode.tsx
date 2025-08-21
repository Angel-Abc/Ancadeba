import { GameItemTreeNode } from '@editor/providers/editTreeProvider'
import { AiTwotoneFolder, AiTwotoneFolderOpen } from 'react-icons/ai'

interface TreeNodeProps {
    node: GameItemTreeNode
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node }): React.JSX.Element => {
    const icon = node.isCollapsed ? <AiTwotoneFolder /> : <AiTwotoneFolderOpen />
    return (
        <div>
            <label>{icon} {node.label}</label>
            {!node.isCollapsed && node.children.length > 0 && (
                <div className='children'>
                    {node.children.map(child => <TreeNode node={child} />)}
                </div>
            )}
        </div>
    )
}
