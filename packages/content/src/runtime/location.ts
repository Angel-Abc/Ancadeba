export interface RuntimeExit {
    id: string
    label: string
    targetLocationId: string
}

export interface RuntimeLocation {
    id: string
    name: string
    description: string
    exits: RuntimeExit[]
}
