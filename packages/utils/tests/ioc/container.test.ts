import { describe, expect, it } from 'vitest'

import { Container } from '../../src/ioc/container'
import { token } from '../../src/ioc/token'
import type { ILogger } from '../../src/utils/logger'

class TestLogger implements ILogger {
    public debug(_category: string, message: string, ..._args: unknown[]): string {
        return message
    }

    public info(_category: string, message: string, ..._args: unknown[]): string {
        return message
    }

    public warn(_category: string, message: string, ..._args: unknown[]): string {
        return message
    }

    public error(_category: string, message: string, ..._args: unknown[]): string {
        return message
    }
}

describe('Container', () => {
    it('returns the parent singleton when resolved from a child container', () => {
        const logger = new TestLogger()
        const root = new Container(logger)
        const child = root.createChild()
        const singletonToken = token<{ id: number }>('singleton-service')
        let factoryCalls = 0

        root.register({
            token: singletonToken,
            scope: 'singleton',
            useFactory: () => ({ id: ++factoryCalls })
        })

        const fromChildFirst = child.resolve(singletonToken)
        const fromChildAgain = child.resolve(singletonToken)
        const fromParent = root.resolve(singletonToken)

        expect(factoryCalls).toBe(1)
        expect(fromChildFirst).toBe(fromParent)
        expect(fromChildAgain).toBe(fromParent)
    })

    it('creates new instances for transient providers registered on a child', () => {
        const logger = new TestLogger()
        const root = new Container(logger)
        const child = root.createChild()
        const transientToken = token<{ id: number }>('transient-service')
        let factoryCalls = 0

        child.register({
            token: transientToken,
            scope: 'transient',
            useFactory: () => ({ id: ++factoryCalls })
        })

        const first = child.resolve(transientToken)
        const second = child.resolve(transientToken)

        expect(first).not.toBe(second)
        expect(factoryCalls).toBe(2)
    })
})

