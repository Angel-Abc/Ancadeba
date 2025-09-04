export interface TreeNode {
    key: number
    label: string
    onClick: () => void
    children: TreeNode[]
}
