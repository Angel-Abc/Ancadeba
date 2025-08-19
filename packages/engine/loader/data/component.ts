import type { Button } from './button'

/**
 * Component displaying a list of {@link Button} elements as a game menu.
 *
 * @property type    Discriminator for the component, always `'game-menu'`.
 * @property buttons Buttons shown in the menu.
 */
export interface GameMenuComponent {
    type: 'game-menu'
    buttons: Button[]
}

/**
 * Component that renders a static image asset.
 *
 * @property type  Discriminator for the component, always `'image'`.
 * @property image Path or identifier of the image to display.
 */
export interface ImageComponent {
    type: 'image'
    image: string
}

interface MapSize {
    rows: number
    columns: number
}

/**
 * Component used to display a square tile map of a given size.
 *
 * @property type    Discriminator for the component, always `'squares-map'`.
 * @property mapSize Dimensions of the rendered map.
 */
export interface SquaresMapComponent {
    type: 'squares-map',
    mapSize: MapSize
}

interface MatrixSize {
    width: number
    height: number
}

/**
 * Component that renders an input matrix with editable cells.
 *
 * @property type       Discriminator for the component, always `'input-matrix'`.
 * @property matrixSize Dimensions of the matrix.
 */
export interface InputMatrixComponent {
    type: 'input-matrix',
    matrixSize: MatrixSize
}

/** Component representing the player's inventory display. */
export interface InventoryComponent {
    type: 'inventory'
}

/** Component showing contextual information about the game state. */
export interface ContextComponent {
    type: 'context'
}

/** Component rendering the player's character representation. */
export interface CharacterComponent {
    type: 'character'
}

/**
 * Component that outputs a log of messages.
 *
 * @property type    Discriminator for the component, always `'output-log'`.
 * @property logSize Maximum number of log lines to retain.
 */
export interface OutputComponent {
    type: 'output-log'
    logSize: number
}

/**
 * Union type of all available component definitions that can appear on a page.
 */
export type Component =
    GameMenuComponent |
    ImageComponent |
    SquaresMapComponent |
    InputMatrixComponent |
    InventoryComponent |
    ContextComponent |
    CharacterComponent |
    OutputComponent


