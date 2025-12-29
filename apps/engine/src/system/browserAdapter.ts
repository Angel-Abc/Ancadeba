import { Token, token } from '@ancadeba/utils'

export interface IBrowserAdapter {
  reload(): void
}

const logName = 'engine/system/BrowserAdapter'
export const browserAdapterToken = token<IBrowserAdapter>(logName)
export const browserAdapterDependencies: Token<unknown>[] = []

export class BrowserAdapter implements IBrowserAdapter {
  reload(): void {
    window.location.reload()
  }
}
