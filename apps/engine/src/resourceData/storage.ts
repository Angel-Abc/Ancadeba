import { Token, token } from '@ancadeba/utils'
import { IJsonConfiguration, jsonConfigurationToken } from '@ancadeba/schemas'

export interface IResourceDataStorage {
  get rootPath(): string
}

const logName = 'engine/resourceData/storage'
export const resourceDataStorageToken = token<IResourceDataStorage>(logName)
export const resourceDataStorageDependencies: Token<unknown>[] = [
  jsonConfigurationToken,
]
export class ResourceDataStorage implements IResourceDataStorage {
  constructor(private readonly jsonConfiguration: IJsonConfiguration) {}
  get rootPath(): string {
    return this.jsonConfiguration.rootPath
  }
}
