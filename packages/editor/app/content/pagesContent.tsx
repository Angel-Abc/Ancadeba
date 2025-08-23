import { BaseContentProps } from './baseContent'

export const PagesContent: React.FC<BaseContentProps> = ({ content }): React.JSX.Element => {
    return (
        <>PAGES CONTENT {content.id}</>
    )
}
