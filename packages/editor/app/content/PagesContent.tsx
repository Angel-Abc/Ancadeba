import { BaseContentProps } from './BaseContent'

export const PagesContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    return (
        <>PAGES CONTENT {id} {label}</>
    )
}
