/**
 * Central registry for mapping string identifiers to React components.
 *
 * The registry enables dynamic component rendering by allowing components to
 * be looked up and extended at runtime.
 */
import { GameMenuComponent } from '@app/controls/component/gameMenuComponent'
import { ImageComponent } from '@app/controls/component/imageComponent'
import { ComponentType } from 'react'
import { logWarning } from '@utils/logMessage'
import { token, Token } from '@ioc/token'
import { SquaresMapComponent } from '@app/controls/component/squaresMapComponent'

export interface IComponentRegistry {
    registerComponent<T = unknown>(type: string, component: ComponentType<T>): void
    getComponent<T = unknown>(type: string): ComponentType<T> | undefined
    clear(): void
}

const logName = 'ComponentRegistry'

export const componentRegistryToken = token<IComponentRegistry>(logName)
export const componentRegistryDependencies: Token<unknown>[] = []

export class ComponentRegistry implements IComponentRegistry {
    private readonly registry = new Map<string, ComponentType<unknown>>()

    constructor() {
        this.registerComponent('image', ImageComponent)
        this.registerComponent('game-menu', GameMenuComponent)
        this.registerComponent('squares-map', SquaresMapComponent)
    }

    public registerComponent<T = unknown>(type: string, component: ComponentType<T>): void {
        if (this.registry.has(type)) {
            logWarning(logName, 'Component already registered under key {0}', type)
            return
        }
        this.registry.set(type, component as ComponentType<unknown>)
    }

    public getComponent<T = unknown>(type: string): ComponentType<T> | undefined {
        return this.registry.get(type) as ComponentType<T> | undefined
    }

    public clear(): void {
        this.registry.clear()
    }
}

