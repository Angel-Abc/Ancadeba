import { IJsonConfiguration, jsonConfigurationToken } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'

export interface IResourceDataProvider {
  get assetsUrl(): string
}

const logName = 'engine/resourceData/provider'
export const resourceDataProviderToken = token<IResourceDataProvider>(logName)
export const resourceDataProviderDependencies: Token<unknown>[] = [
  jsonConfigurationToken,
]
export class ResourceDataProvider implements IResourceDataProvider {
  constructor(private readonly jsonConfiguration: IJsonConfiguration) {}
  get assetsUrl(): string {
    return `${this.jsonConfiguration.rootPath}/assets`
  }
}
