export interface IResourcesConfiguration {
  getResourcesPath(): string
}

export class ResourcesConfiguration implements IResourcesConfiguration {
  constructor(private readonly resourcesDataPath: string) {}

  getResourcesPath(): string {
    return this.resourcesDataPath
  }
}
