import { token, Token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { IServiceProvider, serviceProviderToken } from '@providers/serviceProvider'

export interface IInputsProvider {
    /**
     * Indicates whether the provider is currently active and able to supply inputs.
     *
     * @returns True if the provider should be used.
     */
    isActive(): boolean

    /**
     * Retrieve the inputs provided by this provider.
     *
     * @returns Array of inputs.
     */
    getInputs(): Input[]
}

/**
 * Manages registration of input providers used by the engine.
 */
export interface IInputsProviderRegistry {
    /**
     * Registers an inputs provider by its dependency token.
     *
     * @param providerToken Token referencing the provider.
     */
    registerInputsProvider(providerToken: Token<IInputsProvider>): void

    /**
     * Gets all registered inputs providers.
     *
     * @returns Registered input providers.
     */
    getInputsProviders(): IInputsProvider[]

    /**
     * Clears all registered providers.
     */
    clear(): void
}

const logName = 'InputServiceProvider'
export const inputsProviderRegistryToken = token<IInputsProviderRegistry>(logName)
export const inputsProviderRegistryDependencies: Token<unknown>[] = [serviceProviderToken]

/**
 * Default implementation of {@link IInputsProviderRegistry}.
 */
export class InputsProviderRegistry implements IInputsProviderRegistry {
    private registry: IInputsProvider[] = []

    constructor(
        private serviceProvider: IServiceProvider
    ){}

    /**
     * Register a provider instance using the given token.
     */
    public registerInputsProvider(providerToken: Token<IInputsProvider>): void {
        this.registry.push(this.serviceProvider.getService(providerToken))
    }

    /**
     * Remove all registered inputs providers.
     */
    public clear(): void {
        this.registry = []
    }

    /**
     * Retrieve registered inputs providers.
     */
    public getInputsProviders(): IInputsProvider[] {
        return this.registry
    }
}
