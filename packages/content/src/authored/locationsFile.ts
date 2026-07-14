export interface ExitDefinition {
  id: string
  label: string
  targetLocationId: string
}

export interface ItemPlacementDefinition {
  itemId: string
  takeLabel: string
}

export interface LocationDefinition {
  id: string
  name: string
  description: string
  exits: ExitDefinition[]
  items: ItemPlacementDefinition[]
}

export interface LocationsFile {
  locations: LocationDefinition[]
}