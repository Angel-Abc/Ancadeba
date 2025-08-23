import { BaseContentProps } from './baseContent'

export const RootContent: React.FC<BaseContentProps> = ({ content }): React.JSX.Element => {
    return (
        <>ROOT CONTENT {content.id}</>
    )
}
