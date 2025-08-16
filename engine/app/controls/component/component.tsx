import { Component as ComponentData } from '@loader/data/component'
import { loggerToken, type ILogger } from '@utils/logger'
import { IComponentRegistry, componentRegistryToken } from '@registries/componentRegistry'
import { useService } from '@app/iocProvider'

interface ComponentProps {
    component: ComponentData
}

/**
 * Fallback renderer for unsupported component types.
 * Logs a warning when an unknown component is encountered.
 * @param component - Definition of the unknown component.
 */
const DefaultComponent: React.FC<ComponentProps> = ({ component }): React.JSX.Element => {
    const logger = useService<ILogger>(loggerToken)
    logger.warn('Component', 'Unknown component type: {0}', component.type)
    return (
        <div>Unsupported component type: {component.type}</div>
    )
}

/**
 * Resolves and renders a component using the registry.
 * @param component - Component definition to render.
 */
export const Component: React.FC<ComponentProps> = ({ component }): React.JSX.Element => {
    const registry = useService<IComponentRegistry>(componentRegistryToken)
    const ComponentImpl = registry.getComponent(component.type) ?? DefaultComponent
    return (
        <ComponentImpl component={component} />
    )
}
