import React from 'react'
import { Screen as ScreenData } from '@loader/data/page'

interface ScreenProps {
    screen: ScreenData
}

export const Screen: React.FC<ScreenProps> = ({ screen }): React.JSX.Element => {
    return (
        <>
        {screen.type}
        </>
    )
}
