import { ConditionResolver, conditionResolverDependencies, conditionResolverToken } from '@conditions/conditionResolver'
import { Container } from '@ioc/container'

export class ConditionsBuilder {
    public register(container: Container){
        container.register({
            token: conditionResolverToken,
            useClass: ConditionResolver,
            deps: conditionResolverDependencies
        })
    }
}
