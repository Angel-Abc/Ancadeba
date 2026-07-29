export type RuntimeExitRequirement =
  | {
      type: 'item'
      itemId: string
      consumesItem: boolean
      failureMessage: string
    }
  | {
      type: 'completed-interaction'
      interactionId: string
      failureMessage: string
    }

export interface RuntimeExit {
  id: string
  label: string
  targetLocationId: string
  requirement?: RuntimeExitRequirement | undefined
}

export interface RuntimeItemPlacement {
  itemId: string
  takeLabel: string
}

export interface RuntimeInteractionRequirement {
  itemId: string
  consumesItem: boolean
  failureMessage: string
}

export interface RuntimeInteraction {
  id: string
  label: string
  completionMessage: string
  requirement?: RuntimeInteractionRequirement | undefined
}

export interface RuntimeLocation {
  id: string
  name: string
  description: string
  exits: RuntimeExit[]
  items: RuntimeItemPlacement[]
  interactions: RuntimeInteraction[]
}
