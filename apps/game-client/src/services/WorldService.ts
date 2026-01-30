import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import { World } from '@ancadeba/engine'
import { type IWorldService, WorldServiceLogName } from './types'

export const worldServiceDependencies: Token<unknown>[] = [loggerToken]

export class WorldService implements IWorldService {
  public static readonly logName: string = WorldServiceLogName

  private readonly world: World

  constructor(private readonly logger: ILogger) {
    this.logger.debug(WorldService.logName, 'Initializing ECS World')
    this.world = new World()
    this.logger.info(WorldService.logName, 'ECS World created')
  }

  getWorld(): World {
    return this.world
  }
}
