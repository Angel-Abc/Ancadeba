import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComponentRegistry, componentRegistryToken, IComponentRegistry } from '@registries/componentRegistry'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { Container } from '@ioc/container'

describe('ComponentRegistry', () => {
    let registry: IComponentRegistry
    let container: Container

    beforeEach(() => {
        container = new Container()
        const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        container.register({ token: loggerToken, useValue: logger })
        container.register<IComponentRegistry>({ token: componentRegistryToken, useClass: ComponentRegistry, deps: [loggerToken] })
        registry = container.resolve(componentRegistryToken)
        registry.clear()
    })

    it('logs a warning when registering a duplicate component and does not override it', () => {
        const key = 'test-component'
        const original = () => null
        const duplicate = () => null
        const logger = container.resolve(loggerToken)

        registry.registerComponent(key, original)
        registry.registerComponent(key, duplicate)

        expect(logger.warn).toHaveBeenCalledTimes(1)
        expect(registry.getComponent(key)).toBe(original)
    })

    it('returns undefined when no component registered for type', () => {
        expect(registry.getComponent('missing')).toBeUndefined()
    })
})

