import { ReactNode } from 'react'

export interface ButtonBarProps {
    children: ReactNode
}

export const ButtonBar: React.FC<ButtonBarProps> = ({ children }): React.JSX.Element => {
    return (
        <div className='button-bar'>
            {children}
        </div>
    )
}
