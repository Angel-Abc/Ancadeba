import { Component as ComponentData } from '@ancadeba/schemas'
import { BackgroundComponent } from './Components/Background'
import { MenuComponent } from './Components/Menu'
import { useService } from '@ancadeba/ui'
import { assertNever, ILogger, loggerToken } from '@ancadeba/utils'
import { SquaresMapComponent } from './Components/SquaresMap'

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
