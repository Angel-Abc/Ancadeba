export interface ExitDefinition {
  id: string
  label: string
  targetLocationId: string
}

export interface LocationDefinition {
  id: string
  name: string
  description: string
  exits: ExitDefinition[]
}

export interface LocationsFile {
  locations: LocationDefinition[]
}