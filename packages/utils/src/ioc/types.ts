import type { Token } from './token'

// Allow classes with any constructor parameters to be used by the IoC container.
// Using `any[]` here lets us register classes whose constructors expect
// specific dependency types without TypeScript rejecting them.
export type Class<T> = new (...args: any[]) => T // eslint-disable-line @typescript-eslint/no-explicit-any
export type Factory<T> = (c: IContainer) => T

export type Scope = 'singleton' | 'transient'

type BaseProvider<T> = { token: Token<T>, scope?: Scope }
export type ValueProvider<T> = BaseProvider<T> & { useValue: T }
export type ClassProvider<T> = BaseProvider<T> & { useClass: Class<T>, deps?: Token<unknown>[] }
export type FactoryProvider<T> = BaseProvider<T> & { useFactory: Factory<T>, deps?: Token<unknown>[] }
export type Provider<T = unknown> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T>

// Note: circular import breaker – we only need the type here
export type IContainer = {
  resolve<T>(t: Token<T>): T
}
