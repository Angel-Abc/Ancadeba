import type { Action } from './action'

export interface Handler {
    message: string
    action: Action
}

export type Handlers = Handler[]
