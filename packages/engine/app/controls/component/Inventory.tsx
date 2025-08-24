import { InventoryComponent } from '@loader/data/component'

interface InventoryProps {
    component: InventoryComponent
}

export const Inventory: React.FC<InventoryProps> = ({ component }): React.JSX.Element => {
    return (
        <>
            TODO {component.type}
        </>
    )
}
