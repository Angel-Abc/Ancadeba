import {
  ILogger,
  IMessageBus,
  loggerToken,
  messageBusToken,
  Token,
} from '@ancadeba/utils'
import { ISurfaceDataStorage } from './types'
import { surfaceDataStorageToken } from './tokens'
import { MESSAGE_ENGINE_SURFACE_DATA_CHANGED } from '../message/dataMessages'

export const surfaceDataStorageDependencies: Token<unknown>[] = [
  loggerToken,
  messageBusToken,
]
export class surfaceDataStorage implements ISurfaceDataStorage {
  private _surfaceId: string | null = null

  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IMessageBus,
  ) {}

  set surfaceId(value: string) {
    if (this._surfaceId !== value) {
      this._surfaceId = value
      this.messageBus.publish(MESSAGE_ENGINE_SURFACE_DATA_CHANGED, {
        surfaceId: value,
      })
    }
  }

  get surfaceId(): string {
    if (this._surfaceId === null) {
      throw new Error(
        this.logger.error(surfaceDataStorageToken, 'Surface ID is not set'),
      )
    }
    return this._surfaceId
  }
}
