import { InputRange } from '@ancadeba/schemas'

export interface GameState extends Record<string, unknown> {
  title: string
  activeSceneId: string
  activeMapId: string | null
  flags: Record<string, boolean>
  sceneStack: string[]
  inputRanges?: InputRange
}
