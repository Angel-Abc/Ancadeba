import { RootValidator, rootValidatorDependencies, rootValidatorToken } from '@editor/app/content/validators/rootValidator'
import { Container } from '@ioc/container'

export class ValidatorsBuilder {
    public register(container: Container): void {
        container.register({
            token: rootValidatorToken,
            useClass: RootValidator,
            deps: rootValidatorDependencies
        })
    }
}
