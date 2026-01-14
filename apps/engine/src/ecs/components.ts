export const COMPONENT_KEYS = {
  position: 'position',
  player: 'player',
  inventory: 'inventory',
  appearance: 'appearance',
} as const

export type PositionComponent = {
  x: number
  y: number
}

export type PlayerTagComponent = {
  isPlayer: true
}

export type InventoryItem = {
  itemId: string
  quantity: number
}

export type InventoryComponent = {
  items: InventoryItem[]
  maxWeight?: number
  currentWeight?: number
}

export type EquippedAppearance = {
  categoryId: string
  appearanceId: string
}

export type AppearanceComponent = {
  equipped: EquippedAppearance[]
}

export const createPlayerTag = (): PlayerTagComponent => ({ isPlayer: true })

export const createInventory = (): InventoryComponent => ({
  items: [],
})

export const createAppearanceComponent = (): AppearanceComponent => ({
  equipped: [],
})
