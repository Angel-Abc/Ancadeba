import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComponentRegistry, componentRegistryToken, IComponentRegistry } from '@registries/componentRegistry'
import * as log from '../../utils/logMessage'
import { Container } from '@ioc/container'

describe('ComponentRegistry', () => {
    let registry: IComponentRegistry
    let container: Container

    beforeEach(() => {
        container = new Container()
        container.register<IComponentRegistry>({ token: componentRegistryToken, useClass: ComponentRegistry })
        registry = container.resolve(componentRegistryToken)
        registry.clear()
    })

    it('logs a warning when registering a duplicate component and does not override it', () => {
        const key = 'test-component'
        const original = () => null
        const duplicate = () => null
        const warningSpy = vi.spyOn(log, 'logWarning')

        registry.registerComponent(key, original)
        registry.registerComponent(key, duplicate)

        expect(warningSpy).toHaveBeenCalledTimes(1)
        expect(registry.getComponent(key)).toBe(original)

        warningSpy.mockRestore()
    })

    it('returns undefined when no component registered for type', () => {
        expect(registry.getComponent('missing')).toBeUndefined()
    })
})

