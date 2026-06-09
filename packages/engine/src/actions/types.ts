import type { Action } from '@ancadeba/content'

export interface IGameActionExecutor {
  execute(action: Action): Promise<void>
}

export interface IGameActionEnvironment {
  close(): void
}
