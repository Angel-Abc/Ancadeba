import { RootValidator, rootValidatorDependencies, rootValidatorToken } from '@editor/app/content/validators/rootValidator'
import { LanguagesValidator, languagesValidatorDependencies, languagesValidatorToken } from '@editor/app/content/validators/languagesValidator'
import { PagesValidator, pagesValidatorDependencies, pagesValidatorToken } from '@editor/app/content/validators/pagesValidator'
import { Container } from '@ioc/container'

export class ValidatorsBuilder {
    public register(container: Container): void {
        container.register({
            token: rootValidatorToken,
            useClass: RootValidator,
            deps: rootValidatorDependencies
        })
        container.register({
            token: languagesValidatorToken,
            useClass: LanguagesValidator,
            deps: languagesValidatorDependencies
        })
        container.register({
            token: pagesValidatorToken,
            useClass: PagesValidator,
            deps: pagesValidatorDependencies
        })
    }
}
