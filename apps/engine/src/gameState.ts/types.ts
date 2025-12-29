export interface GameState extends Record<string, unknown> {
  title: string
  activeScene: string
  flags: Record<string, boolean>
  sceneStack: string[]
}
