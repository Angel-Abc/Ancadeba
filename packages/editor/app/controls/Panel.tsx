import { ReactNode } from 'react'

export interface PanelProps {
    title: string
    children: ReactNode
}

export const Panel: React.FC<PanelProps> = ({title, children}): React.JSX.Element => {
    return (
        <div className='panel'>
            <legend>{title}</legend>
            {children}
        </div>    
        )
}
