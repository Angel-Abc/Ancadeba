import { Container } from '@angelabc/utils/ioc'
import { JsonDataLoader, jsonDataLoaderDependencies, jsonDataLoaderToken } from './jsonDataLoader'

export class SchemasBuilder {
    public register(container: Container): void {
        container.register({
            token: jsonDataLoaderToken,
            useClass: JsonDataLoader,
            deps: jsonDataLoaderDependencies
        })
    }
}