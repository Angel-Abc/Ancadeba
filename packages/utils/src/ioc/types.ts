import type { Token } from './token'

export type IContainer = {
  resolve<T>(t: Token<T>): T
  resolveAll<T>(t: Token<T>): T[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args: any[]) => T
export type Factory<T> = (c: IContainer) => T

export type Scope = 'singleton' | 'transient'

export type Dependency =
  | Token<unknown>
  | { token: Token<unknown>; param: string }

type BaseProvider<T> = { token: Token<T>; scope?: Scope }
export type ValueProvider<T> = BaseProvider<T> & { useValue: T }
export type ClassProvider<T> = BaseProvider<T> & {
  useClass: Class<T>
  deps?: Dependency[] | Record<string, Token<unknown>>
}
export type FactoryProvider<T> = BaseProvider<T> & {
  useFactory: Factory<T>
  deps?: Dependency[] | Record<string, Token<unknown>>
}
export type Provider<T = unknown> =
  | ValueProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
