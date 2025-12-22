import { token } from '@ancadeba/utils'

export interface IUIReadySignal {
  readonly ready: Promise<void>
  signalReady(): void
}

const logName = 'engine/system/UIReadySignal'
export const uiReadySignalToken = token<IUIReadySignal>(logName)
export class UIReadySignal implements IUIReadySignal {
  private resolveFn!: () => void

  readonly ready = new Promise<void>((resolve) => {
    this.resolveFn = resolve
  })

  signalReady() {
    this.resolveFn()
  }
}
