import { describe, it, expect, vi } from 'vitest'
import { registerComponent, componentRegistry } from '../../engine/registries/componentRegistry'
import * as log from '../../utils/logMessage'

describe('componentRegistry', () => {
    it('logs a warning when registering a duplicate component and does not override it', () => {
        const key = 'test-component'
        const original = () => null
        const duplicate = () => null
        const warningSpy = vi.spyOn(log, 'logWarning')

        registerComponent(key, original)
        registerComponent(key, duplicate)

        expect(warningSpy).toHaveBeenCalledTimes(1)
        expect(componentRegistry[key]).toBe(original)

        warningSpy.mockRestore()
        delete componentRegistry[key]
    })
})

