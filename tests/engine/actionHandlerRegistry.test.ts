import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ActionHandlerRegistry, actionHandlerRegistryToken, IActionHandler, IActionHandlerRegistry, actionHandlerRegistryDependencies } from '@registries/actionHandlerRegistry'
import { token } from '@ioc/token'
import { Container } from '@ioc/container'
import { IServiceProvider, ServiceProvider, serviceProviderToken } from '@providers/serviceProvider'
import type { PostMessageAction } from '@loader/data/action'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'

class TestHandler implements IActionHandler<PostMessageAction> {
    public readonly type = 'post-message'
    public handled: PostMessageAction | undefined
    handle(action: PostMessageAction): void {
        this.handled = action
    }
}

class OtherHandler implements IActionHandler<PostMessageAction> {
    public readonly type = 'post-message'
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handle(_action: PostMessageAction): void {}
}

describe('ActionHandlerRegistry', () => {
    let registry: IActionHandlerRegistry
    let container: Container

    beforeEach(() => {
        const logger: ILogger = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn((category: string, message: string, ...args: unknown[]) =>
                `[${category}] ${message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))}`),
        }
        container = new Container(logger)
        container.register({ token: loggerToken, useValue: logger })
        container.register<IServiceProvider>({ token: serviceProviderToken, useFactory: c => new ServiceProvider(c) })
        container.register<IActionHandlerRegistry>({ token: actionHandlerRegistryToken, useClass: ActionHandlerRegistry, deps: actionHandlerRegistryDependencies })
        registry = container.resolve(actionHandlerRegistryToken)
        registry.clear()
    })

    it('provides handler instance via service provider', () => {
        const HANDLER = token<IActionHandler<PostMessageAction>>('handler')
        container.register({ token: HANDLER, useClass: TestHandler })

        registry.registerActionHandler('post-message', HANDLER)
        const handler = registry.getActionHandler('post-message')
        expect(handler).toBeInstanceOf(TestHandler)
    })

    it('returns undefined when no handler registered for type', () => {
        const handler = registry.getActionHandler('missing')
        expect(handler).toBeUndefined()
    })

    it('logs a warning when registering a duplicate handler and does not override it', () => {
        const HANDLER = token<IActionHandler<PostMessageAction>>('handler')
        const DUPLICATE = token<IActionHandler<PostMessageAction>>('duplicate')
        container.register({ token: HANDLER, useClass: TestHandler })
        container.register({ token: DUPLICATE, useClass: OtherHandler })
        const logger = container.resolve(loggerToken)

        registry.registerActionHandler('post-message', HANDLER)
        registry.registerActionHandler('post-message', DUPLICATE)

        const handler = registry.getActionHandler('post-message')
        expect(logger.warn).toHaveBeenCalledTimes(1)
        expect(handler).toBeInstanceOf(TestHandler)
    })
})
