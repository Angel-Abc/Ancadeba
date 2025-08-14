import { GameMenuComponent } from '@app/controls/component/gameMenuComponent'
import { ImageComponent } from '@app/controls/component/imageComponent'
import { ComponentType } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<string, ComponentType<any>> = {
    'image': ImageComponent,
    'game-menu': GameMenuComponent
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerComponent = (type: string, component: ComponentType<any>):void => {
    componentRegistry[type] = component
}
