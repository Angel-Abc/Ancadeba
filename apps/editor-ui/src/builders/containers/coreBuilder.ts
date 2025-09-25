import { Container } from '@angelabc/utils/ioc'
import { EditorApplication, editorApplicationDependencies, editorApplicationToken } from '../../core/editorApplication'
import { EditorInitializer, editorInitializerDependencies, editorInitializerToken } from '../../core/initializers/editorInitializer'

export class CoreBuilder {
  public register(container: Container): void {
    container.register({
      token: editorApplicationToken,
      useClass: EditorApplication,
      deps: editorApplicationDependencies
    })
    container.register({
      token: editorInitializerToken,
      useClass: EditorInitializer,
      deps: editorInitializerDependencies
    })
  }
}
