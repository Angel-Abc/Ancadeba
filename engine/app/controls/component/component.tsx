import { Component as ComponentData } from '@loader/data/component'
import { componentRegistry } from '@registries/componentRegistry'

interface ComponentProps {
    component: ComponentData
}

const DefaultComponent: React.FC<ComponentProps> = ({ component }): React.JSX.Element => {
    return (
        <div>TODO: {component.type}</div>
    )
}

export const Component: React.FC<ComponentProps> = ({ component}): React.JSX.Element => {
    const ComponentImpl = componentRegistry[component.type] ?? DefaultComponent
    return (
        <ComponentImpl component={component} />
    )
}
