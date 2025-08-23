import { GameItemTreeNode } from '@editor/providers/editTreeProvider'

export interface BaseContentProps {
    content: GameItemTreeNode
}

export const BaseContent: React.FC<BaseContentProps> = ({ content }): React.JSX.Element => {
    return (
        <>NOT IMPLEMENTED {content.id} - {content.label}</>
    )
}
