import type { Button } from './button'

export interface GameMenuComponent {
    type: 'game-menu'
    buttons: Button[]
}

export interface ImageComponent {
    type: 'image'
    image: string
}

interface MapSize {
    rows: number
    columns: number
}

export interface SquaresMapComponent {
    type: 'squares-map',
    mapSize: MapSize
}

interface MatrixSize {
    width: number
    height: number
}

export interface InputMatrixComponent {
    type: 'input-matrix',
    matrixSize: MatrixSize
}

export interface InventoryComponent {
    type: 'inventory'
}

export interface ContextComponent {
    type: 'context'
}

export interface CharacterComponent {
    type: 'character'
}

export interface OutputComponent {
    type: 'output-log'
    logSize: number
}

export type Component =
    GameMenuComponent |
    ImageComponent |
    SquaresMapComponent |
    InputMatrixComponent |
    InventoryComponent |
    ContextComponent |
    CharacterComponent |
    OutputComponent


