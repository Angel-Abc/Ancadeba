import { ILogger, loadJsonResource, loggerToken, Token } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { ISurfaceLoader } from './types'
import { IResourceConfiguration } from '../configuration/types'
import { Surface, surfaceSchema } from '../schemas/surface'

export const surfaceLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourceConfigurationToken,
]
export class SurfaceLoader implements ISurfaceLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadSurface(surfacePath: string): Promise<Surface> {
    const path = `${this.resourceConfiguration.resourcePath}/${surfacePath}`
    return loadJsonResource<Surface>(path, surfaceSchema, this.logger)
  }
}
