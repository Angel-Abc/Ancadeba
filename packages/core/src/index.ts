export { type GameState, createInitialGameState } from './gameState.js'

export {
  type ExitAvailability,
  getCurrentLocation,
  followExit,
  getExitAvailability,
} from './navigation.js'

export {
  getAvailableItemPlacements,
  getItem,
  getInventoryItems,
  takeItem,
} from './inventory.js'
