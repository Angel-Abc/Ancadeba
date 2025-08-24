export interface BaseContentProps {
    id: number
    label: string
}

export const BaseContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    return (
        <>NOT IMPLEMENTED {id} - {label}</>
    )
}
