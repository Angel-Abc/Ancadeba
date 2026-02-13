import { Token } from '@ancadeba/utils'
import { ISurfaceDataProvider } from './types'
import { surfaceDataStorageToken } from '../../storage/data/tokens'
import { ISurfaceDataStorage } from '../../storage/data/types'

export const surfaceDataProviderDependencies: Token<unknown>[] = [
  surfaceDataStorageToken,
]
export class SurfaceDataProvider implements ISurfaceDataProvider {
  constructor(private readonly surfaceDataStorage: ISurfaceDataStorage) {}

  get surfaceId(): string {
    return this.surfaceDataStorage.surfaceId
  }
}
