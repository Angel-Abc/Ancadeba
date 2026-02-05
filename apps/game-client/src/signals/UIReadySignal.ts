import { token } from '@ancadeba/utils'

export interface IUIReadySignal {
  readonly ready: Promise<void>
  signalReady(): void
}

export const uiReadySignalToken = token<IUIReadySignal>(
  'game-client/signals/UIReadySignal',
)
export class UIReadySignal implements IUIReadySignal {
  private _resolveReady!: () => void

  public readonly ready: Promise<void> = new Promise<void>((resolve) => {
    this._resolveReady = resolve
  })

  signalReady(): void {
    this._resolveReady()
  }
}
