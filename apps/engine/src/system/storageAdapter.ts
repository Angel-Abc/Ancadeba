import { Token, token } from '@ancadeba/utils'

export interface IStorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const logName = 'engine/system/StorageAdapter'
export const storageAdapterToken = token<IStorageAdapter>(logName)
export const storageAdapterDependencies: Token<unknown>[] = []

export class StorageAdapter implements IStorageAdapter {
  getItem(key: string): string | null {
    return window.localStorage.getItem(key)
  }

  setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value)
  }

  removeItem(key: string): void {
    window.localStorage.removeItem(key)
  }
}
