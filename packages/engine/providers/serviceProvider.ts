import { token, Token } from '@ioc/token'
import { Container } from '@ioc/types'

/**
 * Defines a contract for resolving services by their {@link Token}.
 */
export interface IServiceProvider {
    /**
     * Retrieve a service instance associated with the given token.
     *
     * @param t - Token identifying the desired service.
     * @returns The resolved service instance.
     */
    getService<T>(t: Token<T>): T
}

const logName = 'ServiceProvider'
export const serviceProviderToken = token<IServiceProvider>(logName)
export class ServiceProvider implements IServiceProvider {
    /**
     * Creates a new instance of {@link ServiceProvider} that resolves
     * services from the specified IoC container.
     *
     * @param container - Container used to resolve services.
     */
    constructor(private container: Container){}

    /**
     * Resolve a service instance for the provided token.
     *
     * @param t - Token identifying the service to resolve.
     * @returns The resolved service instance.
     */
    public getService<T>(t: Token<T>): T {
        return this.container.resolve(t)
    }
}
