import { IMessageBus, messageBusToken, Token, token } from '@ancadeba/utils'
import { CoreMessagePayloads } from '../messages/core'
import { UIMessagePayloads } from '../messages/ui'

export type EngineMessagePayloads = CoreMessagePayloads & UIMessagePayloads

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
  constructor(private readonly messageBus: IMessageBus) {}

  publish<M extends EngineMessage>(
    message: M,
    payload: EngineMessagePayloads[M]
  ): void {
    this.messageBus.publish(message, payload)
  }

  publishRaw(message: string, payload: unknown): void {
    this.messageBus.publish(message, payload)
  }

  subscribe<M extends EngineMessage>(
    message: M,
    handler: (payload: EngineMessagePayloads[M]) => void
  ): () => void {
    return this.messageBus.subscribe(message, (payload) => {
      handler(payload as EngineMessagePayloads[M])
    })
  }

  subscribeRaw(
    message: string,
    handler: (payload: unknown) => void
  ): () => void {
    return this.messageBus.subscribe(message, handler)
  }
}
