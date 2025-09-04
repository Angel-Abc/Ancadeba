import { TreeNode } from './types'

export interface NodeProps {
    node: TreeNode
}

export const Node: React.FC<NodeProps> = ({ node }): React.JSX.Element => {
    return (
        <ul>
            <a onClick={() => node.onClick()}>{node.label}</a>
            {node.children.map(childNode => (
                <li key={childNode.key}>
                    <Node node={childNode} />
                </li>
            ))}
        </ul>
    )
}
