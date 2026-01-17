import { IComponentRegistry } from './componentRegistry'
import { BackgroundComponent } from './Components/Background'
import { MenuComponent } from './Components/Menu'
import { SquaresMapComponent } from './Components/SquaresMap'
import { InventoryComponent } from './Components/Inventory'
import { AppearanceComponent } from './Components/Appearance'
import { CharacterSheetComponent } from './Components/CharacterSheet'
import { TextLogComponent } from './Components/TextLog'
import { InputBarComponent } from './Components/InputBar'
import { ItemDetailsComponent } from './Components/ItemDetails'

export function registerComponents(registry: IComponentRegistry): void {
  registry.register('background', BackgroundComponent)
  registry.register('menu', MenuComponent)
  registry.register('squares-map', SquaresMapComponent)
  registry.register('inventory', InventoryComponent)
  registry.register('appearance', AppearanceComponent)
  registry.register('character-sheet', CharacterSheetComponent)
  registry.register('text-log', TextLogComponent)
  registry.register('input-bar', InputBarComponent)
  registry.register('item-details', ItemDetailsComponent)
}
