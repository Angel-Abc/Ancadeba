import { IResourceConfiguration } from './types'

export class ResourceConfiguration implements IResourceConfiguration {
  constructor(public readonly resourcePath: string) {}
}
