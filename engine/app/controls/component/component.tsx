import { Component as ComponentData } from '@loader/data/component'
import { logWarning } from '@utils/logMessage'
import { IComponentRegistry, componentRegistryToken } from '@registries/componentRegistry'
import { useService } from '@app/iocProvider'

interface ComponentProps {
    component: ComponentData
}

const DefaultComponent: React.FC<ComponentProps> = ({ component }): React.JSX.Element => {
    logWarning('Component', 'Unknown component type: {0}', component.type)
    return (
        <div>Unsupported component type: {component.type}</div>
    )
}

export const Component: React.FC<ComponentProps> = ({ component }): React.JSX.Element => {
    const registry = useService<IComponentRegistry>(componentRegistryToken)
    const ComponentImpl = registry.getComponent(component.type) ?? DefaultComponent
    return (
        <ComponentImpl component={component} />
    )
}
