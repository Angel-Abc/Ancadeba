import type { IGameActionEnvironment } from './types'

export class BrowserGameActionEnvironment implements IGameActionEnvironment {
  close(): void {
    window.close()
  }
}
