import type { Token } from './token'

export type IContainer = {
  resolve<T>(t: Token<T>): T
  resolveAll<T>(t: Token<T>): T[]
}

export type Class<T> = new (...args: any[]) => T
export type Factory<T> = (c: IContainer) => T

export type Scope = 'singleton' | 'transient'

type BaseProvider<T> = { token: Token<T>; scope?: Scope }
export type ValueProvider<T> = BaseProvider<T> & { useValue: T }
export type ClassProvider<T> = BaseProvider<T> & {
  useClass: Class<T>
  deps?: Token<unknown>[]
}
export type FactoryProvider<T> = BaseProvider<T> & {
  useFactory: Factory<T>
  deps?: Token<unknown>[]
}
export type Provider<T = unknown> =
  | ValueProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
