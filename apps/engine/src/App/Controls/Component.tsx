import { Component as ComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
import { ILogger, loggerToken } from '@ancadeba/utils'
import { componentRegistryToken, IComponentRegistry } from './componentRegistry'

interface ComponentProps {
  component: ComponentData
}

export function Component({ component }: ComponentProps) {
  const logName = 'App.Controls.Component'
  const logger = useService<ILogger>(loggerToken)
  const registry = useService<IComponentRegistry>(componentRegistryToken)

  const ComponentImpl = registry.resolve(component.type)

  if (!ComponentImpl) {
    logger.warn(logName, 'Unknown component type: {0}', component.type)
    return null
  }

  return <ComponentImpl component={component} />
}
