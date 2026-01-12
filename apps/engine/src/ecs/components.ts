export const COMPONENT_KEYS = {
  position: 'position',
  player: 'player',
} as const

export type PositionComponent = {
  x: number
  y: number
}

export type PlayerTagComponent = {
  isPlayer: true
}

export const createPlayerTag = (): PlayerTagComponent => ({ isPlayer: true })
