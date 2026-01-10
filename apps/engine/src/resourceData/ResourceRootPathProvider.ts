import { Token, token } from '@ancadeba/utils'
import { IJsonConfiguration, jsonConfigurationToken } from '@ancadeba/schemas'

export interface IResourceRootPath {
  get rootPath(): string
}

const logName = 'engine/resourceData/ResourceRootPathProvider'
export const resourceRootPathToken = token<IResourceRootPath>(logName)
export const resourceRootPathProviderDependencies: Token<unknown>[] = [
  jsonConfigurationToken,
]

export class ResourceRootPathProvider implements IResourceRootPath {
  constructor(private readonly jsonConfiguration: IJsonConfiguration) {}

  get rootPath(): string {
    return this.jsonConfiguration.rootPath
  }
}
