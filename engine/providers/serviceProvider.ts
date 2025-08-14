import { token, Token } from '@ioc/token'
import { Container } from '@ioc/types'

export interface IServiceProvider {
    getService<T>(t: Token<T>): T
}

const logName = 'ServiceProvider'
export const serviceProviderToken = token<IServiceProvider>(logName)
export class ServiceProvider implements IServiceProvider {
    constructor(private container: Container){}

    public getService<T>(t: Token<T>): T {
        return this.container.resolve(t)
    }
}
