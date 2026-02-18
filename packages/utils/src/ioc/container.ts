import type { ILogger } from '../logger/types'
import { describeToken, type Token } from './token'
import type {
  IContainer,
  IRegistrar,
  Provider,
  ValueProvider,
  ClassProvider,
  FactoryProvider,
  Scope,
  Dependency,
} from './types'

type ProviderHandler = (p: Provider<unknown>, container: Container) => unknown

export class Container implements IContainer, IRegistrar {
  private static readonly logName: string = 'utils/ioc/container'

  private static readonly strategies: ReadonlyMap<string, ProviderHandler> =
    new Map<string, ProviderHandler>([
      ['useValue', (p) => (p as ValueProvider<unknown>).useValue],
      [
        'useClass',
        (p, container) => {
          const cp = p as ClassProvider<unknown>
          if (cp.deps && !Array.isArray(cp.deps)) {
            const depsObject: Record<string, unknown> = {}
            for (const [key, depToken] of Object.entries(cp.deps)) {
              depsObject[key] = container.resolve(depToken as Token<unknown>)
            }
            return new cp.useClass(depsObject)
          }
          const depDefs = (cp.deps as Dependency[]) ?? []
          const deps = depDefs.map((d) => {
            const depToken = typeof d === 'symbol' ? d : d.token
            return container.resolve(depToken)
          })
          return new cp.useClass(...deps)
        },
      ],
      [
        'useFactory',
        (p, container) => (p as FactoryProvider<unknown>).useFactory(container),
      ],
    ])

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
    for (const [key, handle] of Container.strategies) {
      if (key in p) return handle(p as Provider<unknown>, this) as T
    }
    throw new Error(
      this.logger.error(
        Container.logName,
        'Invalid provider for {0}',
        describeToken((p as Provider<T>).token),
      ),
    )
  }
}
