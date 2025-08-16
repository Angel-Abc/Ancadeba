import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ActionExecuter } from '@actions/actionExecuter'
import type { BaseAction } from '@loader/data/action'
import type { ActionHandlerRegistry } from '@registries/actionHandlerRegistry'
import type { ILogger } from '@utils/logger'

const KNOWN_TYPE = 'known-action'

describe('ActionExecuter', () => {
    let handler: { handle: ReturnType<typeof vi.fn> }
    let registry: ActionHandlerRegistry
    let executer: ActionExecuter
    let logger: ILogger

    beforeEach(() => {
        handler = { handle: vi.fn() }
        registry = {
            getActionHandler: vi.fn((type: string) => (type === KNOWN_TYPE ? handler : undefined))
        } as unknown as ActionHandlerRegistry
        logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        executer = new ActionExecuter(registry, logger)
    })

    it('invokes handler when registered', () => {
        const action = { type: KNOWN_TYPE } as BaseAction
        executer.execute(action)
        expect(handler.handle).toHaveBeenCalledWith(action, undefined, undefined)
    })

    it('logs and throws when handler missing', () => {
        const action = { type: 'missing-action' } as BaseAction
        expect(() => executer.execute(action)).toThrow('No action handler found for type missing-action')
        expect(logger.error).toHaveBeenCalledWith('ActionExecuter', 'No action handler found for type {0}', 'missing-action')
    })
})

