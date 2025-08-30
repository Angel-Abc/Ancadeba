import classNames from 'classnames'
import { ReactNode } from 'react'

export interface PanelProps {
    title: string
    children: ReactNode
    className?: string
}

export const Panel: React.FC<PanelProps> = ({title, children, className}): React.JSX.Element => {
    return (
        <fieldset className={classNames('panel', className)} >
            <legend>{title}</legend>
            {children}
        </fieldset>
        )
}
