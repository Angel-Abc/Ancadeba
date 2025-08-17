import { Token, token } from '@ioc/token'
import { Condition } from '@loader/data/condition'
import { IConditionResolver } from '@registries/conditionResolverRegistry'
import { IScriptService, scriptServiceToken } from '@services/scriptService'

export type IScriptCondition = IConditionResolver

const logName = 'ScriptCondition'
export const scriptConditionToken = token<IScriptCondition>(logName)
export const scriptConditionDependencies: Token<unknown>[] = [scriptServiceToken]

/**
 * Evaluates conditions by executing provided scripts.
 */
export class ScriptCondition implements IScriptCondition {
    readonly type = 'script' as const

    constructor(
        private scriptService: IScriptService
    ){}

   /**
    * Executes the script associated with the condition and returns its boolean result.
    *
    * @param condition The condition containing the script to execute.
    * @returns The boolean result of the script execution.
    */
   public resolve(condition: Condition): boolean {
       return this.scriptService.runScript<boolean, unknown>(condition.script, undefined)
   }
}
