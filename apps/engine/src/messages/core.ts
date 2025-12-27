import { Action } from '@ancadeba/schemas'

export const CORE_MESSAGES = {
  GAME_ENGINE_STARTED: 'CORE/GAME_ENGINE_STARTED',
  GAME_ENGINE_STOPPED: 'CORE/GAME_ENGINE_STOPPED',
  EXECUTE_ACTION: 'CORE/EXECUTE_ACTION',
} as const

export type CoreMessage = (typeof CORE_MESSAGES)[keyof typeof CORE_MESSAGES]

export type CoreMessagePayloads = {
  [CORE_MESSAGES.GAME_ENGINE_STARTED]: undefined
  [CORE_MESSAGES.GAME_ENGINE_STOPPED]: undefined
  [CORE_MESSAGES.EXECUTE_ACTION]: { action: Action }
}
