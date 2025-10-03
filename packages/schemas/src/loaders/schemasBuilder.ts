import { Container } from '@angelabc/utils/ioc'
import { JsonDataLoader, jsonDataLoaderConfigurationToken, jsonDataLoaderDependencies, jsonDataLoaderToken } from './jsonDataLoader'

export class SchemasBuilder {
    public register(container: Container, dataPath: string): void {
        container.register({
            token: jsonDataLoaderConfigurationToken,
            useValue: { rootPath: dataPath },
            deps: []
        })
        container.register({
            token: jsonDataLoaderToken,
            useClass: JsonDataLoader,
            deps: jsonDataLoaderDependencies
        })
    }
}