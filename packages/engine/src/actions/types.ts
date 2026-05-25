import type { Action } from '@ancadeba/content'

export interface IGameActionExecutor {
  execute(action: Action): void
}

export interface IGameActionEnvironment {
  close(): void
}
