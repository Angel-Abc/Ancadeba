import type { Component } from './component'
import type { Condition } from './condition'
import type { Input } from './inputs'

/**
 * Bounding box for placing a component on a grid-based screen.
 *
 * @property top    Top row index of the component area.
 * @property left   Left column index of the component area.
 * @property right  Right column index of the component area.
 * @property bottom Bottom row index of the component area.
 */
export interface GridScreenPosition {
    top: number
    left: number
    right: number
    bottom: number
}

/**
 * Item that associates a component with its position and optional condition.
 *
 * @property id        Unique symbol identifying the item.
 * @property position  Coordinates where the component is placed.
 * @property component Component to render.
 * @property condition Optional condition controlling visibility.
 */
export interface GridScreenItem {
    id: symbol
    position: GridScreenPosition
    component: Component
    condition?: Condition
}

/**
 * Screen layout composed of positioned components arranged on a grid.
 *
 * @property type       Discriminator for the screen type, always `'grid'`.
 * @property width      Number of columns in the grid.
 * @property height     Number of rows in the grid.
 * @property components Components placed on the grid.
 */
export interface GridScreen {
    type: 'grid'
    width: number
    height: number
    components: GridScreenItem[]
}
/** Union type of all possible screen layouts. */
export type Screen = GridScreen

/**
 * Top level definition of a page in the game.
 *
 * @property id     Unique identifier of the page.
 * @property screen Screen layout displayed for the page.
 * @property inputs Interactive inputs available on the page.
 */
export type Page = {
    id: string
    screen: Screen
    inputs: Input[]
}
