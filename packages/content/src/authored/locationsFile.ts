export type ExitRequirementDefinition =
  | {
      type: 'item'
      itemId: string
      failureMessage: string
    }
  | {
      type: 'completed-interaction'
      interactionId: string
      failureMessage: string
    }

export interface ExitDefinition {
  id: string
  label: string
  targetLocationId: string
  requirement?: ExitRequirementDefinition | undefined
}

export interface ItemPlacementDefinition {
  itemId: string
  takeLabel: string
}

export interface InteractionRequirementDefinition {
  itemId: string
  failureMessage: string
}

export interface InteractionDefinition {
  id: string
  label: string
  completionMessage: string
  requirement?: InteractionRequirementDefinition | undefined
}

export interface LocationDefinition {
  id: string
  name: string
  description: string
  exits: ExitDefinition[]
  items: ItemPlacementDefinition[]
  interactions: InteractionDefinition[]
}

export interface LocationsFile {
  locations: LocationDefinition[]
}
