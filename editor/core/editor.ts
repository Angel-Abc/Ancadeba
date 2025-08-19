import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'

export interface IEditor {
    start(): Promise<void>
}

const logName = 'Editor'
export const editorToken = token<IEditor>(logName)
export const editorDependencies: Token<unknown>[] = [loggerToken]
export class Editor implements IEditor {
    constructor(
        private logger: ILogger
    ) { }

    public async start(): Promise<void> {
        this.logger.info(logName, 'Editor start')
    }
}
