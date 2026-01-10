import { Token, token } from '@ancadeba/utils'
import { VirtualKeyMapping } from '../system/virtualKeyMapper'

export interface VirtualInputMapping {
  virtualKeys: string[]
  virtualInput: string
  label: string
}

export interface IVirtualKeyStorage {
  setVirtualKeys(virtualKeys: VirtualKeyMapping[]): void
  getVirtualKeys(): VirtualKeyMapping[]
}

export interface IVirtualInputStorage {
  setVirtualInputs(virtualInputs: VirtualInputMapping[]): void
  getVirtualInputs(): VirtualInputMapping[]
}

export const virtualKeyStorageToken = token<IVirtualKeyStorage>(
  'engine/resourceData/virtualKeyStorage'
)
export const virtualInputStorageToken = token<IVirtualInputStorage>(
  'engine/resourceData/virtualInputStorage'
)
export const virtualInputConfigStorageDependencies: Token<unknown>[] = []

export class VirtualInputConfigStorage
  implements IVirtualKeyStorage, IVirtualInputStorage
{
  private virtualKeys: VirtualKeyMapping[] = []
  private virtualInputs: VirtualInputMapping[] = []

  constructor() {}

  setVirtualKeys(virtualKeys: VirtualKeyMapping[]): void {
    this.virtualKeys = virtualKeys
  }

  getVirtualKeys(): VirtualKeyMapping[] {
    return this.virtualKeys
  }

  setVirtualInputs(virtualInputs: VirtualInputMapping[]): void {
    this.virtualInputs = virtualInputs
  }

  getVirtualInputs(): VirtualInputMapping[] {
    return this.virtualInputs
  }
}
