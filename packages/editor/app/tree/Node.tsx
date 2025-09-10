import { TreeNode } from './types'

export interface NodeProps {
    node: TreeNode
}

export const Node: React.FC<NodeProps> = ({ node }): React.JSX.Element => {
    return (
        <li>
            <button type="button" onClick={() => node.onClick()}>{node.label}</button>
            {node.children.length > 0 && (
                <ul>
                    {node.children.map(childNode => (
                        <Node key={childNode.key} node={childNode} />
                    ))}
                </ul>
            )}
        </li>
    )
}
