import { InputRange } from '@ancadeba/schemas'

export interface GameState extends Record<string, unknown> {
  title: string
  activeSceneId: string
  activeMapId: string | null
  mapPosition?: {
    x: number
    y: number
  }
  flags: Record<string, boolean>
  sceneStack: string[]
  inputRanges?: InputRange
}
