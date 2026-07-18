export { parseGameManifest } from './parsers/parseGameManifest.js'

export { parseLocationsFile } from './parsers/parseLocationsFile.js'

export { assembleGameContent } from './assemblers/assembleGameContent.js'

export { parseItemsFile } from './parsers/parseItemsFile.js'

export type { GameManifest } from './authored/gameManifest.js'
export type { ItemDefinition, ItemsFile } from './authored/itemsFile.js'
export type {
  ExitDefinition,
  ExitRequirementDefinition,
  InteractionDefinition,
  InteractionRequirementDefinition,
  ItemPlacementDefinition,
  LocationDefinition,
  LocationsFile,
} from './authored/locationsFile.js'

export type { RuntimeGameContent } from './runtime/gameContent.js'

export type {
  RuntimeExit,
  RuntimeExitRequirement,
  RuntimeLocation,
  RuntimeItemPlacement,
  RuntimeInteraction,
  RuntimeInteractionRequirement,
} from './runtime/location.js'

export type { RuntimeItem } from './runtime/item.js'
