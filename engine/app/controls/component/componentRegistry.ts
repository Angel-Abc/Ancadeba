import { ComponentType } from 'react'
import { ImageComponent } from './imageComponent'
import { GameMenuComponent } from './gameMenuComponent'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<string, ComponentType<any>> = {
    'image': ImageComponent,
    'game-menu': GameMenuComponent
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerComponent = (type: string, component: ComponentType<any>):void => {
    componentRegistry[type] = component
}
