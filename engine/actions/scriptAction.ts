import { Token, token } from '@ioc/token'
import { ScriptAction as ScriptActionData } from '@loader/data/action'
import { IActionHandler } from '@registries/actionHandlerRegistry'
import { IScriptService, scriptServiceToken } from '@services/scriptService'
import { Message } from '@utils/types'

export type IScriptAction = IActionHandler<ScriptActionData>

interface ActionData {
    message?: Message,
    data?: unknown
}

const logName = 'ScriptAction'
export const scriptActionToken = token<IScriptAction>(logName)
export const scriptActionDependencies: Token<unknown>[] = [scriptServiceToken]
export class ScriptAction implements IScriptAction {
    readonly type = 'script' as const

    constructor(
        private scriptService: IScriptService
    ){}

    public handle(action: ScriptActionData, message?: Message, data?: unknown): void {
        this.scriptService.runScript<void, ActionData>(action.script, { message, data })
    }
}
