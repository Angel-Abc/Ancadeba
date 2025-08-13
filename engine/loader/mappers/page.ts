import type { Screen as ScreenData, GridScreenItem as GridScreenItemData, Page as PageData } from '@loader/data/page'
import type { Component as ComponentData } from '@loader/data/component'
import type { Button as ButtonData } from '@loader/data/button'
import { type Screen, type GridScreenItem, type Page } from '@loader/schema/page'
import { type Component } from '@loader/schema/component'
import { type Button } from '@loader/schema/button'
import { mapAction } from './action'
import { mapInputs } from './input'

export function mapPage(basePath: string,page: Page): PageData {
    return {
        id: page.id,
        screen: mapScreen(basePath, page.screen),
        inputs: mapInputs(page.inputs)
    }
}

export function mapScreen(basePath: string, screen: Screen): ScreenData {
    switch (screen.type) {
        case 'grid':
            return {
                type: 'grid',
                width: screen.width,
                height: screen.height,
                components: mapGridScreenComponents(basePath, screen.components)
            }
    }
}

export function mapGridScreenComponents(basePath: string, components: GridScreenItem[]): GridScreenItemData[] {
    return components.map((c, i) => mapGridScreenComponent(basePath, c, i))
}

export function mapGridScreenComponent(basePath: string, item: GridScreenItem, index: number): GridScreenItemData {
    return {
        id: Symbol(`grid-screen-${index}`),
        position: {
            top: item.position.top,
            left: item.position.left,
            right: item.position.right,
            bottom: item.position.bottom
        },
        component: mapComponent(basePath, item.component),
        condition: item.condition
    }
}

export function mapComponent(basePath: string, component: Component): ComponentData {
    switch (component.type) {
        case 'game-menu':
            return {
                type: 'game-menu',
                buttons: mapButtons(component.buttons)
            }
        case 'image':
            return {
                type: 'image',
                image: `${basePath}/${component.image}`
            }
        case 'squares-map':
            return {
                type: 'squares-map',
                mapSize: {
                    rows: component.mapSize.rows,
                    columns: component.mapSize.columns
                }
            }
        case 'input-matrix':
            return {
                type: 'input-matrix',
                matrixSize: {
                    width: component.matrixSize.width,
                    height: component.matrixSize.height
                }
            }
        case 'inventory':
            return {
                type: 'inventory'
            }
        case 'context':
            return {
                type: 'context'
            }
        case 'character':
            return {
                type: 'character'
            }
        case 'output-log':
            return {
                type: 'output-log',
                logSize: component.logSize
            }
    }
}

export function mapButtons(buttons: Button[]): ButtonData[] {
    return buttons.map(mapButton)
}

export function mapButton(button: Button): ButtonData {
    return {
        label: button.label,
        action: mapAction(button.action)
    }
}

