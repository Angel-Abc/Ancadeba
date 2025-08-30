import { RootValidator, rootValidatorDependencies, rootValidatorToken } from '@editor/app/content/validators/rootValidator'
import { LanguagesValidator, languagesValidatorDependencies, languagesValidatorToken } from '@editor/app/content/validators/languagesValidator'
import { PagesValidator, pagesValidatorDependencies, pagesValidatorToken } from '@editor/app/content/validators/pagesValidator'
import { Container } from '@ioc/container'
import { TranslationsPathValidator, translationsPathValidatorDependencies, translationsPathValidatorToken } from '@editor/app/content/validators/translationsPathValidator'
import { TranslationsEntriesValidator, translationsEntriesValidatorDependencies, translationsEntriesValidatorToken } from '@editor/app/content/validators/translationsEntriesValidator'

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
        container.register({
            token: translationsPathValidatorToken,
            useClass: TranslationsPathValidator,
            deps: translationsPathValidatorDependencies
        })
        container.register({
            token: translationsEntriesValidatorToken,
            useClass: TranslationsEntriesValidator,
            deps: translationsEntriesValidatorDependencies
        })
    }
}
