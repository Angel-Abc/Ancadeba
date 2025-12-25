import { Component as ComponentData } from '@ancadeba/schemas'
import { BackgroundComponent } from './Components/Background'
import { MenuComponent } from './Components/Menu'

interface ComponentProps {
  component: ComponentData
}

export function Component({ component }: ComponentProps) {
  // TODO: resolve components from some sort of registry
  switch (component.type) {
    case 'background':
      return <BackgroundComponent component={component} />
    case 'menu':
      return <MenuComponent component={component} />
  }
}
