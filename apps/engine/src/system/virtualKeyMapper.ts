import { KeyboardEvent, Token, token } from '@ancadeba/utils'
import {
  IVirtualKeyStorage,
  virtualKeyStorageToken,
} from '../resourceData/storage'

export interface VirtualKeyMapping {
  code: string
  shift: boolean
  ctrl: boolean
  alt: boolean
  virtualKey: string
}

export interface IVirtualKeyMapper {
  findMapping(event: KeyboardEvent): VirtualKeyMapping | undefined
}

const logName = 'engine/system/virtualKeyMapper'
export const virtualKeyMapperToken = token<IVirtualKeyMapper>(logName)

export const virtualKeyMapperDependencies: Token<unknown>[] = [
  virtualKeyStorageToken,
]

export class VirtualKeyMapper implements IVirtualKeyMapper {
  constructor(private readonly virtualKeyStorage: IVirtualKeyStorage) {}

  findMapping(event: KeyboardEvent): VirtualKeyMapping | undefined {
    const virtualKeys = this.virtualKeyStorage.getVirtualKeys()
    return virtualKeys.find(
      (m) =>
        m.code === event.code &&
        m.shift === event.shift &&
        m.ctrl === event.ctrl &&
        m.alt === event.alt
    )
  }
}
