import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ActionExecuter } from '@actions/actionExecuter'
import type { BaseAction } from '@loader/data/action'
import type { ActionHandlerRegistry } from '@registries/actionHandlerRegistry'
import * as log from '../../utils/logMessage'

const KNOWN_TYPE = 'known-action'

describe('ActionExecuter', () => {
    let handler: { handle: ReturnType<typeof vi.fn> }
    let registry: ActionHandlerRegistry
    let executer: ActionExecuter

    beforeEach(() => {
        handler = { handle: vi.fn() }
        registry = {
            getActionHandler: vi.fn((type: string) => (type === KNOWN_TYPE ? handler : undefined))
        } as unknown as ActionHandlerRegistry
        executer = new ActionExecuter(registry)
    })

    it('invokes handler when registered', () => {
        const action = { type: KNOWN_TYPE } as BaseAction
        executer.execute(action)
        expect(handler.handle).toHaveBeenCalledWith(action, undefined, undefined)
    })

    it('triggers fatalError when handler missing', () => {
        const action = { type: 'missing-action' } as BaseAction
        const fatalErrorSpy = vi.spyOn(log, 'fatalError')
        expect(() => executer.execute(action)).toThrow()
        expect(fatalErrorSpy).toHaveBeenCalledWith('ActionExecuter', 'No action handler found for type {0}', 'missing-action')
        fatalErrorSpy.mockRestore()
    })
})

