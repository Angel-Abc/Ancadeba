import {
  type IResourcesConfiguration,
  ResourcesConfigurationLogName,
} from './types'

export class ResourcesConfiguration implements IResourcesConfiguration {
  public static readonly logName: string = ResourcesConfigurationLogName

  constructor(private readonly resourcesDataPath: string) {}

  getResourcesPath(): string {
    return this.resourcesDataPath
  }
}
