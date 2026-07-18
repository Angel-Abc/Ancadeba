export interface RuntimeExitRequirement {
  itemId: string
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
