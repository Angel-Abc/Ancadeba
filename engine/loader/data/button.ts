import type { Action } from './action'

export interface Button {
    id: symbol
    label: string
    action: Action
}
