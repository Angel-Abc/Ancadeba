import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import { surfaceSchema, type Surface } from '../schemas/surface'
import { resourcesConfigurationToken } from '../configuration/tokens'
import type { IResourcesConfiguration } from '../configuration/types'
import { type ISurfaceLoader, SurfaceLoaderLogName } from './types'

export const surfaceLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourcesConfigurationToken,
]

export class SurfaceLoader implements ISurfaceLoader {
  public static readonly logName: string = SurfaceLoaderLogName

  constructor(
    private readonly logger: ILogger,
    private readonly resourcesConfiguration: IResourcesConfiguration,
  ) {}

  async load(surfacePath: string): Promise<Surface> {
    const baseUrl = this.resourcesConfiguration.getResourcesPath()
    this.logger.debug(
      SurfaceLoader.logName,
      'Loading surface from {0}/{1}',
      baseUrl,
      surfacePath,
    )

    const response = await fetch(`${baseUrl}/${surfacePath}`)

    if (!response.ok) {
      throw new Error(
        `Failed to load surface ${surfacePath}: ${response.status}`,
      )
    }

    const data = await response.json()
    const parsed = surfaceSchema.parse(data)

    this.logger.debug(SurfaceLoader.logName, 'Surface loaded: {0}', parsed.id)
    return parsed
  }

  async loadAll(surfacePaths: string[]): Promise<Surface[]> {
    const baseUrl = this.resourcesConfiguration.getResourcesPath()
    this.logger.debug(
      SurfaceLoader.logName,
      'Loading {0} surfaces from {1}',
      surfacePaths.length,
      baseUrl,
    )

    const surfaces = await Promise.all(
      surfacePaths.map((path) => this.load(path)),
    )

    this.logger.debug(
      SurfaceLoader.logName,
      'Loaded {0} surfaces: {1}',
      surfaces.length,
      surfaces.map((s) => s.id).join(', '),
    )

    return surfaces
  }
}
