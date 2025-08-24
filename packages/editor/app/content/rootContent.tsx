import { BaseContentProps } from './baseContent'

export const RootContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    return (
        <>ROOT CONTENT {id} {label}</>
    )
}
