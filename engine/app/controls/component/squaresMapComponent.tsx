import { useService } from '@app/iocProvider'
import { type SquaresMapComponent as SquaresMapComponentData } from '@loader/data/component'
import { MAP_SWITCHED } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'

interface SquaresMapComponentProps {
    component: SquaresMapComponentData
}

export const SquaresMapComponent: React.FC<SquaresMapComponentProps> = ({component}): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    const [mapId, setMapId] = useState<string | null>(gameDataProvider.Context.currentMapId)

    useEffect(() => {
        return messageBus.registerMessageListener(MAP_SWITCHED, () => {
            setMapId(gameDataProvider.Context.currentMapId)
        })
    }, [
        messageBus, 
        gameDataProvider
    ])

    if (!mapId) return (<></>)

    return (
        <>
            Map size: {component.mapSize.columns} x {component.mapSize.rows} - {mapId}
        </>
    )
}
