import { Token, token } from '@angelabc/utils/ioc'
import { ILogger, loggerToken } from '@angelabc/utils/utils'
import { editorInitializerToken, IEditorInitializer } from './initializers/editorInitializer'

export interface IEditorApplication {
  start(): Promise<void>
}

const logName = 'EditorApplication'
export const editorApplicationToken = token<IEditorApplication>(logName)
export const editorApplicationDependencies: Token<unknown>[] = [
  loggerToken,
  editorInitializerToken
]

export class EditorApplication implements IEditorApplication {
  constructor(
    private logger: ILogger,
    private editorInitializer: IEditorInitializer
  ) {}

  public async start(): Promise<void> {
    this.logger.debug(logName, 'Starting editor UI')
    this.editorInitializer.initialize()
  }
}
