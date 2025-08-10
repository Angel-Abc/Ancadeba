import type { Action } from './action'
import type { Condition } from './condition'

export type Behavior = {
    canMove: boolean
}

export type GotoDialogAction = {
    type: 'goto'
    target: string
}

export type EndDialogAction = {
    type: 'end-dialog',
    message?: string
}

export type DialogAction = Action | GotoDialogAction | EndDialogAction

export type DialogChoice = {
    id: string
    label: string
    visible?: Condition
    enabled?: Condition
    action: DialogAction
}

export type Dialog = {
    id: string
    message: string
    behavior: Behavior
    choices: DialogChoice[]
}

export type DialogSet = {
    id: string
    startCondition: Condition
    startWith: string
    dialogs: Record<string, Dialog>
}
