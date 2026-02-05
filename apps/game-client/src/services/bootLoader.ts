// load the absolute minimum to get the boot screen up and running (if defined)

import { Token, token } from '@ancadeba/utils'
import { IUIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'

export interface IBootLoader {
  loadBootScreen(): Promise<void>
}

export const bootLoaderToken = token<IBootLoader>(
  'game-client/services/bootLoader',
)
export const bootLoaderDependencies: Token<unknown>[] = [uiReadySignalToken]
export class BootLoader implements IBootLoader {
  constructor(private readonly uiReadySignal: IUIReadySignal) {}

  async loadBootScreen(): Promise<void> {
    // no-op

    // wait for the UI to be ready
    await this.uiReadySignal.ready
  }
}
