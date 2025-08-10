import type { Token } from './token'

export type Class<T> = new (...args: any[]) => T
export type Factory<T> = (c: Container) => T

export type Scope = 'singleton' | 'transient'

type BaseProvider<T> = { token: Token<T>, scope?: Scope }
export type ValueProvider<T> = BaseProvider<T> & { useValue: T }
export type ClassProvider<T> = BaseProvider<T> & { useClass: Class<T>, deps?: Token<any>[] }
export type FactoryProvider<T> = BaseProvider<T> & { useFactory: Factory<T>, deps?: Token<any>[] }
export type Provider<T = any> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T>

// Note: circular import breaker – we only need the type here
export type Container = {
  resolve<T>(t: Token<T>): T
}