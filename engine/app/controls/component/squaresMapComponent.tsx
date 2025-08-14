import { type SquaresMapComponent as SquaresMapComponentData } from '@loader/data/component'

interface SquaresMapComponentProps {
    component: SquaresMapComponentData
}

export const SquaresMapComponent: React.FC<SquaresMapComponentProps> = ({component}): React.JSX.Element => {
    return (
        <>
            Map size: {component.mapSize.columns} x {component.mapSize.rows}
        </>
    )
}
