import { token, Token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { IServiceProvider, serviceProviderToken } from '@providers/serviceProvider'

export interface IInputsProvider {
    isActive(): boolean
    getInputs(): Input[]
}

export interface IInputsProviderRegistry {
    registerInputsProvider(providerToken: Token<IInputsProvider>): void
    getInputsProviders(): IInputsProvider[]
    clear(): void
}

const logName = 'InputServiceProvider'
export const inputsProviderRegistryToken = token<IInputsProviderRegistry>(logName)
export const inputsProviderRegistryDependencies: Token<unknown>[] = [serviceProviderToken]
export class InputsProviderRegistry implements IInputsProviderRegistry {
    private registry: IInputsProvider[] = []

    constructor(
        private serviceProvider: IServiceProvider
    ){}

    public registerInputsProvider(providerToken: Token<IInputsProvider>): void {
        this.registry.push(this.serviceProvider.getService(providerToken))
    }

    public clear(): void {
        this.registry = []
    }

    public getInputsProviders(): IInputsProvider[] {
        return this.registry
    }
}
