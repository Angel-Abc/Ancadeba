import { Token, token } from '@ancadeba/utils'

export interface IGameEngine {
  start(): Promise<void>
}

const logName = 'engine/core/GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = []
export class GameEngine implements IGameEngine {
  constructor() {}

  async start(): Promise<void> {
    // Game engine starting logic goes here
  }
}
