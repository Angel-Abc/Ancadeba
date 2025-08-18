import { token } from '@ioc/token'

/**
 * Contract for initializing a subsystem of the engine.
 */
export interface ISubsystemInitializer {
    /**
     * Initializes the subsystem.
     */
    initialize(): Promise<void> | void
}

export const subsystemInitializersToken = token<ISubsystemInitializer[]>('subsystem-initializers')
