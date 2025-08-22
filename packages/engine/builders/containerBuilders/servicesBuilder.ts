import { Container } from '@ioc/container'
import { InputSourcesService, inputSourcesServiceDependencies, inputSourcesServiceToken } from '@services/inputSourcesService'
import { ScriptService, scriptServiceDependencies, scriptServiceToken } from '@services/scriptService'
import { TranslationService, translationServiceDependencies, translationServiceToken } from '@services/translationService'

export class ServicesBuilder {
    public register(container: Container): void {
        container.register({
            token: translationServiceToken,
            useClass: TranslationService,
            deps: translationServiceDependencies
        })
        container.register({
            token: inputSourcesServiceToken,
            useClass: InputSourcesService,
            deps: inputSourcesServiceDependencies
        })
        container.register({
            token: scriptServiceToken,
            useClass: ScriptService,
            deps: scriptServiceDependencies
        })
    }
}
