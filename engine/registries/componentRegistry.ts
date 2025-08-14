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

export interface IComponentRegistry {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerComponent(type: string, component: ComponentType<any>): void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getComponent(type: string): ComponentType<any> | undefined
    clear(): void
}

const logName = 'ComponentRegistry'

export const componentRegistryToken = token<IComponentRegistry>(logName)
export const componentRegistryDependencies: Token<unknown>[] = []

export class ComponentRegistry implements IComponentRegistry {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly registry = new Map<string, ComponentType<any>>()

    constructor() {
        this.registerComponent('image', ImageComponent)
        this.registerComponent('game-menu', GameMenuComponent)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public registerComponent(type: string, component: ComponentType<any>): void {
        if (this.registry.has(type)) {
            logWarning(logName, 'Component already registered under key {0}', type)
            return
        }
        this.registry.set(type, component)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getComponent(type: string): ComponentType<any> | undefined {
        return this.registry.get(type)
    }

    public clear(): void {
        this.registry.clear()
    }
}

