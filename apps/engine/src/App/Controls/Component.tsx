import { Component as ComponentData } from '@ancadeba/schemas'
import { BackgroundComponent } from './Components/Background'
import { MenuComponent } from './Components/Menu'
import { useService } from '@ancadeba/ui'
import { assertNever, ILogger, loggerToken } from '@ancadeba/utils'
import { SquaresMapComponent } from './Components/SquaresMap'
import { InventoryComponent } from './Components/Inventory'
import { AppearanceComponent } from './Components/Appearance'
import { CharacterSheetComponent } from './Components/CharacterSheet'
import { TextLogComponent } from './Components/TextLog'
import { InputBarComponent } from './Components/InputBar'

interface ComponentProps {
  component: ComponentData
}

export function Component({ component }: ComponentProps) {
  const logName = 'App.Controls.Component'
  const logger = useService<ILogger>(loggerToken)
  // TODO: resolve components from some sort of registry
  switch (component.type) {
    case 'background':
      return <BackgroundComponent component={component} />
    case 'menu':
      return <MenuComponent component={component} />
    case 'squares-map':
      return <SquaresMapComponent component={component} />
    case 'inventory':
      return <InventoryComponent component={component} />
    case 'appearance':
      return <AppearanceComponent component={component} />
    case 'character-sheet':
      return <CharacterSheetComponent component={component} />
    case 'text-log':
      return <TextLogComponent component={component} />
    case 'input-bar':
      return <InputBarComponent component={component} />
    default: {
      logger.warn(
        logName,
        'Unknown component type: {0}',
        (component as ComponentData).type
      )
      return assertNever(component)
    }
  }
}
