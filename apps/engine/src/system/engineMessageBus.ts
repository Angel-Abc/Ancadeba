import { messageBusToken, Token, token } from '@ancadeba/utils'
import { CoreMessagePayloads } from '../messages/core'

export type EngineMessagePayloads = CoreMessagePayloads

export type EngineMessage = keyof EngineMessagePayloads

export interface IEngineMessageBus {
  publish<M extends EngineMessage>(
    message: M,
    payload: EngineMessagePayloads[M]
  ): void
  publishRaw(message: string, payload: unknown): void
  subscribe<M extends EngineMessage>(
    message: M,
    handler: (payload: EngineMessagePayloads[M]) => void
  ): () => void
  subscribeRaw(message: string, handler: (payload: unknown) => void): () => void
}

const logName = 'engine/system/EngineMessageBus'
export const engineMessageBusToken = token<IEngineMessageBus>(logName)
export const engineMessageBusDependencies: Token<unknown>[] = [messageBusToken]
export class EngineMessageBus implements IEngineMessageBus {
  constructor(private readonly messageBus: IEngineMessageBus) {}

  publish<M extends EngineMessage>(
    message: M,
    payload: EngineMessagePayloads[M]
  ): void {
    this.messageBus.publish(message, payload)
  }

  publishRaw(message: string, payload: unknown): void {
    this.messageBus.publishRaw(message, payload)
  }

  subscribe<M extends EngineMessage>(
    message: M,
    handler: (payload: EngineMessagePayloads[M]) => void
  ): () => void {
    return this.messageBus.subscribe(message, handler)
  }

  subscribeRaw(
    message: string,
    handler: (payload: unknown) => void
  ): () => void {
    return this.messageBus.subscribeRaw(message, handler)
  }
}
