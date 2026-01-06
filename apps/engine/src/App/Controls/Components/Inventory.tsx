// In the future we might add a more configurable inventory panel here
// For now, it's just a placeholder component

import { InventoryComponent as InventoryComponentData } from '@ancadeba/schemas'

interface InventoryComponentProps {
  component: InventoryComponentData
}

export function InventoryComponent({ component }: InventoryComponentProps) {
  return (
    <div className="inventory-component">
      <h3>Inventory</h3>
      <p>This is a placeholder for the inventory panel. {component.type}</p>
    </div>
  )
}
