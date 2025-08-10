export type Tile = {
    key: string
    description: string
    color: string
    image?: string
}

export type TileSet = {
    id: string
    tiles: Tile[]
}
