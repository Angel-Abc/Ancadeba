import { describeToken, type Token } from './token'
import type { Provider, Scope } from './types'
import { logWarning } from '@utils/logMessage'

const logName: string = 'Container'

function isFunction(v: unknown): v is (...args: unknown[]) => unknown {
  return typeof v === 'function'
}

export class Container {
  private providers = new Map<Token<unknown>, Provider<unknown>>()
  private singletons = new Map<Token<unknown>, unknown>()
  private resolving: Token<unknown>[] = []
  readonly parent?: Container

  constructor(parent?: Container) { this.parent = parent }

  register<T>(provider: Provider<T>): this {
    if (this.providers.has(provider.token)) {
      logWarning(logName, 'Provider for {0} already registered', describeToken(provider.token))
    }
    this.providers.set(provider.token, provider)
    return this
  }

  registerAll(providers: Provider<unknown>[]): this {
    providers.forEach(p => this.register(p))
    return this
  }

  has<T>(t: Token<T>): boolean {
    return this.providers.has(t) || !!this.parent?.has(t)
  }

  createChild(): Container { return new Container(this) }

  resolve<T>(t: Token<T>): T {
    if (this.singletons.has(t)) return this.singletons.get(t) as T

    const p = this.providers.get(t) ?? this.parent?.getProvider(t)
    if (!p) throw new Error(`No provider for ${describeToken(t)}`)

    if (this.resolving.includes(t)) {
      const path = [...this.resolving, t].map(describeToken).join(' -> ')
      throw new Error(`IoC circular dependency: ${path}`)
    }

    this.resolving.push(t)
    try {
      const instance = this.instantiate(p)
      const scope = (p as {scope?: Scope}).scope ?? 'singleton'
      const isValueFunction = 'useValue' in p && isFunction((p as {useValue: T}).useValue)
      if (scope === 'singleton' && !isValueFunction) this.singletons.set(t, instance)
      return instance as T
    } finally {
      this.resolving.pop()
    }
  }

  private getProvider<T>(t: Token<T>): Provider<T> | undefined {
    return (this.providers.get(t) ?? this.parent?.getProvider(t)) as Provider<T> | undefined
  }

  private instantiate<T>(p: Provider<T>): T {
    if ('useValue' in p) return p.useValue
    if ('useClass' in p) {
      const deps = (p.deps ?? []).map(d => this.resolve(d))
      return new p.useClass(...deps)
    }
    if ('useFactory' in p) return p.useFactory(this)
    throw new Error('Invalid provider')
  }
}
