import { Container } from '@angelabc/utils/ioc'
import { EditorApplication, editorApplicationDependencies, editorApplicationToken } from '../../core/editorApplication'

export class CoreBuilder {
  public register(container: Container): void {
    container.register({
      token: editorApplicationToken,
      useClass: EditorApplication,
      deps: editorApplicationDependencies
    })
  }
}
