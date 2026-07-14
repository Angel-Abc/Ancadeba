export interface RuntimeExit {
    id: string
    label: string
    targetLocationId: string
}

export interface RuntimeItemPlacement {
    itemId: string
    takeLabel: string
}

export interface RuntimeLocation {
    id: string
    name: string
    description: string
    exits: RuntimeExit[]
    items: RuntimeItemPlacement[]
}
