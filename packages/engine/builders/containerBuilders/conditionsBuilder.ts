import { ConditionResolver, conditionResolverDependencies, conditionResolverToken } from '@conditions/conditionResolver'
import { ScriptCondition, scriptConditionDependencies, scriptConditionToken } from '@conditions/scriptCondition'
import { Container } from '@ioc/container'

export class ConditionsBuilder {
    public register(container: Container): void {
        container.register({
            token: conditionResolverToken,
            useClass: ConditionResolver,
            deps: conditionResolverDependencies
        })
        container.register({
            token: scriptConditionToken,
            useClass: ScriptCondition,
            deps: scriptConditionDependencies
        })
    }
}
