import { BaseContentProps } from './baseContent'

export const PagesContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    return (
        <>PAGES CONTENT {id} {label}</>
    )
}
