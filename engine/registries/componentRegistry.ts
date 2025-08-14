/**
 * Central registry for mapping string identifiers to React components.
 *
 * The registry enables dynamic component rendering by allowing components to
 * be looked up and extended at runtime. New components can be registered
 * using {@link registerComponent} and later retrieved from
 * {@link componentRegistry} by their type key.
 */
import { GameMenuComponent } from '@app/controls/component/gameMenuComponent'
import { ImageComponent } from '@app/controls/component/imageComponent'
import { ComponentType } from 'react'
import { logWarning } from '@utils/logMessage'

/**
 * Holds the mapping between component type strings and their React
 * implementations. Consumers can query this registry to render components
 * dynamically based on their type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<string, ComponentType<any>> = {
    'image': ImageComponent,
    'game-menu': GameMenuComponent
}

const logName = 'ComponentRegistry'

/**
 * Registers a new component under the specified type key.
 *
 * @param type - Unique string used to reference the component.
 * @param component - React component associated with the given type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerComponent = (type: string, component: ComponentType<any>): void => {
    if (Object.prototype.hasOwnProperty.call(componentRegistry, type)) {
        logWarning(logName, 'Component already registered under key {0}', type)
        return
    }
    componentRegistry[type] = component
}

