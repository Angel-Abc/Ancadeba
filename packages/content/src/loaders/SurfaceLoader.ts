import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import { surfaceSchema, type Surface } from '../schemas/surface'

export interface ISurfaceLoader {
  load(baseUrl: string, surfacePath: string): Promise<Surface>
  loadAll(baseUrl: string, surfacePaths: string[]): Promise<Surface[]>
}

export const surfaceLoaderDependencies: Token<unknown>[] = [loggerToken]

const logName = 'content/loaders/SurfaceLoader'

export class SurfaceLoader implements ISurfaceLoader {
  constructor(private readonly logger: ILogger) {}

  async load(baseUrl: string, surfacePath: string): Promise<Surface> {
    this.logger.debug(
      logName,
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

    this.logger.debug(logName, 'Surface loaded: {0}', parsed.id)
    return parsed
  }

  async loadAll(baseUrl: string, surfacePaths: string[]): Promise<Surface[]> {
    this.logger.debug(
      logName,
      'Loading {0} surfaces from {1}',
      surfacePaths.length,
      baseUrl,
    )

    const surfaces = await Promise.all(
      surfacePaths.map((path) => this.load(baseUrl, path)),
    )

    this.logger.debug(
      logName,
      'Loaded {0} surfaces: {1}',
      surfaces.length,
      surfaces.map((s) => s.id).join(', '),
    )

    return surfaces
  }
}
