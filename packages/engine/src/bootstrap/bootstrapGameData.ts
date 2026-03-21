import { Token } from '@ancadeba/utils'
import { IBootstrapGameData } from './types'

export const bootstrapGameDataDependencies: Token<unknown>[] = []

export class BootstrapGameData implements IBootstrapGameData {
  async execute(): Promise<void> {
    // Nothing to do here, the game data is loaded in the bootstrap engine.
  }
}
