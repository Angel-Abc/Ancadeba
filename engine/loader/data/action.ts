export interface PostMessageAction {
    type: 'post-message'
    message: string
    payload: number | string | Record<string, unknown>
}

export interface ScriptAction {
    type: 'script'
    script: string
}

export type Action = PostMessageAction | ScriptAction
export type BaseAction = { type: string }
