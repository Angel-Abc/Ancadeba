import type { Handler as HandlerData, Handlers as HandlersData } from '@loader/data/handler'
import { type Handler, type Handlers } from '@loader/schema/handler'
import { mapAction } from './action'

export function mapHandler(handler: Handler): HandlerData {
    return {
        message: handler.message,
        action: mapAction(handler.action)
    }
}

export function mapHandlers(handlers: Handlers): HandlersData {
    return handlers.map(mapHandler)
}