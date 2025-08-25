import { ReactNode } from 'react'

export interface LabeledControlContainerProps {
    label: string
    children: ReactNode
}

export const LabeledControlContainer: React.FC<LabeledControlContainerProps> = ({label, children}): React.JSX.Element => {
    return (
        <div className='labeled-control'>
            <label>{label}</label>
            <div className='container'>
                {children}
            </div>
        </div>
    )
}
