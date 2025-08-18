/**
 * {@link IActionHandler} that executes arbitrary scripts via the
 * {@link IScriptService}. This enables dynamic behaviours defined in game data
 * to run within the engine's sandboxed environment. The script receives the
 * triggering {@link Message} and optional auxiliary data, allowing it to react
 * to runtime conditions.
 */
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

    /**
     * Executes the provided script with the given context.
     *
     * @param action - Contains the script source to run.
     * @param message - Optional engine message supplied to the script.
     * @param data - Optional auxiliary payload supplied to the script.
     *
     * The script is run synchronously through {@link IScriptService.runScript}.
     * The incoming `message` and `data` are available inside the script as
     * `data.message` and `data.data` respectively. The script's return value is
     * ignored and any exception will bubble up to the caller.
     *
     * @example
     * // Log the message that triggered the action
     * {
     *   script: "console.log(data.message)"
     * }
     */
    public handle(action: ScriptActionData, message?: Message, data?: unknown): void {
        this.scriptService.runScript<void, ActionData>(action.script, { message, data })
    }
}
