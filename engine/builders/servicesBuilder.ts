import { Container } from '@ioc/container'
import { InputSourcesService, inputSourcesServiceDependencies, inputSourcesServiceToken } from '@services/inputSourcesService'
import { ScriptService, scriptServiceDependencies, scriptServiceToken } from '@services/scriptService'
import { TranslationService, translationServiceDependencies, translationServiceToken } from '@services/translationService'

/**
 * Registers application level services.
 */
export class ServicesBuilder {
  /**
   * Register service dependencies into the container.
   */
  register(container: Container): void {
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

