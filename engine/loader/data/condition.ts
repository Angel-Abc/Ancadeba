export interface ScriptCondition {
    type: 'script'
    script: string
}

export type Condition = ScriptCondition

export const trueCondition: Condition = {
    type: 'script',
    script: 'return true'
}
