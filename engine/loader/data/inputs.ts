import type { BaseAction } from './action'
import type { Condition } from './condition'

export interface VirtualKey {
    virtualKey: string
    keyCode: string
    shift: boolean
    ctrl: boolean
    alt: boolean
}
export type VirtualKeys = VirtualKey[]

export interface VirtualInput {
    virtualInput: string
    virtualKeys: string[]
    label: string
}
export type VirtualInputs = VirtualInput[]

export interface Input {
    virtualInput: string
    preferredRow?: number
    preferredCol?: number
    label: string
    description: string
    visible: Condition
    enabled: Condition
    action: BaseAction
}