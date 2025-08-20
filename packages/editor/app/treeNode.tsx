import { GameItemTreeNode } from '@editor/providers/editTreeProvider'

interface TreeNodeProps {
    node: GameItemTreeNode
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node }): React.JSX.Element => {
    return (
        <ul>{node.label}
            {node.children.map(child => <li><TreeNode node={child} /></li>)}
        </ul>
    )
}
