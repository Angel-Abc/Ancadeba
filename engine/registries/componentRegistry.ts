/**
 * Central registry for mapping string identifiers to React components.
 *
 * The registry enables dynamic component rendering by allowing components to
 * be looked up and extended at runtime.
 */
import { GameMenu } from '@app/controls/component/gameMenu'
import { Image } from '@app/controls/component/image'
import { ComponentType } from 'react'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { token, Token } from '@ioc/token'
import { SquaresMap } from '@app/controls/component/squaresMap'
import { InputMatrix } from '@app/controls/component/inputMatrix'

export interface IComponentRegistry {
    /**
     * Registers a React component with the given identifier.
     *
     * @param type - Unique identifier of the component
     * @param component - The component to associate with the identifier
     */
    registerComponent<T = unknown>(type: string, component: ComponentType<T>): void
    /**
     * Retrieves a component previously registered under the provided identifier.
     *
     * @param type - Identifier of the component to retrieve
     * @returns The component if found, otherwise `undefined`
     */
    getComponent<T = unknown>(type: string): ComponentType<T> | undefined
    /** Clears all registered components. */
    clear(): void
}

const logName = 'ComponentRegistry'

export const componentRegistryToken = token<IComponentRegistry>(logName)
export const componentRegistryDependencies: Token<unknown>[] = [loggerToken]

export class ComponentRegistry implements IComponentRegistry {
    private readonly registry = new Map<string, ComponentType<unknown>>()
    constructor(private logger: ILogger) {
        this.registerComponent('image', Image)
        this.registerComponent('game-menu', GameMenu)
        this.registerComponent('squares-map', SquaresMap)
        this.registerComponent('input-matrix', InputMatrix)
    }

    /**
     * Registers a React component with the given identifier.
     *
     * @param type - Unique identifier of the component
     * @param component - The component to associate with the identifier
     */
    public registerComponent<T = unknown>(type: string, component: ComponentType<T>): void {
        if (this.registry.has(type)) {
            this.logger.warn(logName, 'Component already registered under key {0}', type)
            return
        }
        this.registry.set(type, component as ComponentType<unknown>)
    }

    /**
     * Retrieves a component previously registered under the provided identifier.
     *
     * @param type - Identifier of the component to retrieve
     * @returns The component if found, otherwise `undefined`
     */
    public getComponent<T = unknown>(type: string): ComponentType<T> | undefined {
        return this.registry.get(type) as ComponentType<T> | undefined
    }

    /** Clears all registered components. */
    public clear(): void {
        this.registry.clear()
    }
}

