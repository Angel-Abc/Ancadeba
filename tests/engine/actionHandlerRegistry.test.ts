import { describe, it, expect, beforeEach } from 'vitest'
import { ActionHandlerRegistry, actionHandlerRegistryToken, IActionHandler } from '@registries/actionHandlerRegistry'
import { token } from '@ioc/token'
import { Container } from '@ioc/container'
import { ServiceProvider } from '@providers/serviceProvider'
import type { PostMessageAction } from '@loader/data/action'

class TestHandler implements IActionHandler<PostMessageAction> {
    public readonly type = 'post-message'
    public handled: PostMessageAction | undefined
    handle(action: PostMessageAction): void {
        this.handled = action
    }
}

describe('ActionHandlerRegistry', () => {
    let registry: ActionHandlerRegistry
    let serviceProvider: ServiceProvider
    let container: Container

    beforeEach(() => {
        container = new Container()
        container.register({ token: actionHandlerRegistryToken, useClass: ActionHandlerRegistry })
        registry = container.resolve(actionHandlerRegistryToken)
        registry.clear()
        serviceProvider = new ServiceProvider(container)
    })

    it('provides handler instance via service provider', () => {
        const HANDLER = token<IActionHandler<PostMessageAction>>('handler')
        container.register({ token: HANDLER, useClass: TestHandler })

        registry.registerActionHandler('post-message', HANDLER)
        const handler = registry.getActionHandler('post-message', serviceProvider)
        expect(handler).toBeInstanceOf(TestHandler)
    })

    it('returns undefined when no handler registered for type', () => {
        const handler = registry.getActionHandler('missing', serviceProvider)
        expect(handler).toBeUndefined()
    })
})
