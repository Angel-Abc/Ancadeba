import { Component as ComponentData } from '@loader/data/component'
import { componentRegistry } from './componentRegistry'
import { logWarning } from '@utils/logMessage'

interface ComponentProps {
    component: ComponentData
}

const DefaultComponent: React.FC<ComponentProps> = ({ component }): React.JSX.Element => {
    logWarning('Component', 'Unknown component type: {0}', component.type)
    return (
        <div>Unsupported component type: {component.type}</div>
    )
}

export const Component: React.FC<ComponentProps> = ({ component}): React.JSX.Element => {
    const ComponentImpl = componentRegistry[component.type] ?? DefaultComponent
    return (
        <ComponentImpl component={component} />
    )
}
