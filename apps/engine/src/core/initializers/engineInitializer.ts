import { Token, token } from '@angelabc/utils/ioc'
import { IProvidersInitializer, providersInitializerToken } from './providersInitializer'

export interface IEngineInitializer {
    initialize(): Promise<void>
}

const logName = 'engineInitializer'
export const engineInitializerToken = token<IEngineInitializer>(logName)
export const engineInitializerDependencies: Token<unknown>[] = [
    providersInitializerToken
]
export class EngineInitializer implements IEngineInitializer {
    constructor(
        private providersInitializer: IProvidersInitializer
    ) { }

    public async initialize(): Promise<void> {
        await this.providersInitializer.initialize()
    }
}