import type { ILogger } from '../logger/types'
import { describeToken, type Token } from './token'
import type { IContainer, Provider, Scope, Dependency } from './types'

export class Container implements IContainer {
  private static readonly logName: string = 'utils/ioc/container'
  private providers = new Map<Token<unknown>, Provider<unknown>[]>()
  private singletons = new WeakMap<Provider<unknown>, unknown>()
  private resolving: Token<unknown>[] = []

  constructor(private logger: ILogger) {}

  register<T>(provider: Provider<T>): this {
    const existing = this.providers.get(provider.token)
    if (existing) {
      existing.push(provider as Provider<unknown>)
    } else {
      this.providers.set(provider.token, [provider as Provider<unknown>])
    }
    return this
  }

  registerAll(providers: Provider<unknown>[]): this {
    providers.forEach((p) => this.register(p))
    return this
  }

  has<T>(t: Token<T>): boolean {
    return this.providers.has(t)
  }

  getProviders<T>(t: Token<T>): Provider<T>[] {
    const providers = this.providers.get(t) as Provider<T>[] | undefined
    return providers ?? []
  }

  resolveProvider<T>(provider: Provider<T>, t: Token<T>): T {
    if (this.singletons.has(provider as Provider<unknown>)) {
      return this.singletons.get(provider as Provider<unknown>) as T
    }

    if (this.resolving.includes(t)) {
      const path = [...this.resolving, t].map(describeToken).join(' -> ')
      throw new Error(
        this.logger.error(
          Container.logName,
          'Circular dependency detected: {0}',
          path,
        ),
      )
    }

    this.resolving.push(t)
    try {
      const instance = this.instantiate(provider)
      const scope = (provider as { scope?: Scope }).scope ?? 'transient'
      if (scope === 'singleton') {
        this.singletons.set(provider as Provider<unknown>, instance)
      }
      return instance as T
    } finally {
      this.resolving.pop()
    }
  }

  resolve<T>(t: Token<T>): T {
    const providers = this.getProviders(t)
    if (providers.length === 0) {
      throw new Error(
        this.logger.error(
          Container.logName,
          'No provider for {0}',
          describeToken(t),
        ),
      )
    }

    if (providers.length > 1) {
      this.logger.warn(
        Container.logName,
        'Multiple providers found for {0}, using the first one registered',
        describeToken(t),
      )
    }

    const provider = providers[0] as Provider<T>
    return this.resolveProvider(provider, t)
  }

  resolveAll<T>(t: Token<T>): T[] {
    const providers = this.getProviders(t)
    const instances: T[] = []

    for (const provider of providers) {
      const instance = this.resolveProvider(provider, t)
      instances.push(instance)
    }

    return instances
  }

  private instantiate<T>(p: Provider<T>): T {
    if ('useValue' in p) return p.useValue
    if ('useClass' in p) {
      if (p.deps && !Array.isArray(p.deps)) {
        // Handle Record<string, Token<unknown>> -> Always usage object injection
        const depsObject: Record<string, unknown> = {}
        for (const [key, token] of Object.entries(p.deps)) {
          depsObject[key] = this.resolve(token)
        }
        return new p.useClass(depsObject)
      }

      const depDefs = (p.deps as Dependency[]) ?? []
      const deps = depDefs.map((d) => {
        const token = typeof d === 'symbol' ? d : d.token
        return this.resolve(token)
      })

      // Use positional injection for array dependencies
      return new p.useClass(...deps)
    }
    if ('useFactory' in p) return p.useFactory(this)

    throw new Error(
      this.logger.error(
        Container.logName,
        'Invalid provider for {0}',
        describeToken((p as Provider<T>).token),
      ),
    )
  }
}
