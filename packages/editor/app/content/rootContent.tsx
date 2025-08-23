import { GameItemTreeNode } from '@editor/providers/editTreeProvider'

interface RootContentProps {
    content: GameItemTreeNode
}

export const RootContent: React.FC<RootContentProps> = ({ content }): React.JSX.Element => {
    return (
        <>ROOT CONTENT {content.id}</>
    )
}
