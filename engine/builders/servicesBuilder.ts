import { Container } from '@ioc/container'
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
  }
}

