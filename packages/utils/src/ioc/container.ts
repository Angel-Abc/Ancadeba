import { isFunction } from '../checks/typeChecks'
import { ILogger } from '../logger/types'
import { describeToken, Token } from './token'
import { IContainer, Provider, Scope } from './types'

const logName: string = 'utils/ioc/container'

export class Container implements IContainer {
  private providers = new Map<Token<unknown>, Provider<unknown>[]>()
  private singletons = new Map<Token<unknown>, unknown>()
  private resolving: Token<unknown>[] = []
  readonly parent?: Container

  constructor(
    private logger: ILogger,
    parent?: Container
  ) {
    this.parent = parent
  }

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
    return this.providers.has(t) || !!this.parent?.has(t)
  }

  createChild(): Container {
    return new Container(this.logger, this)
  }

  resolve<T>(t: Token<T>): T {
    const providers = this.providers.get(t) as Provider<T>[] | undefined
    if (!providers || providers.length === 0) {
      if (this.parent) return this.parent.resolve(t)
      throw new Error(
        this.logger.error(logName, 'No provider for {0}', describeToken(t))
      )
    }

    const provider = providers[0]
    if (!provider) {
      throw new Error(
        this.logger.error(logName, 'No provider for {0}', describeToken(t))
      )
    }
    if (this.singletons.has(t)) return this.singletons.get(t) as T

    if (this.resolving.includes(t)) {
      const path = [...this.resolving, t].map(describeToken).join(' -> ')
      throw new Error(
        this.logger.error(logName, 'Circular dependency detected: {0}', path)
      )
    }

    this.resolving.push(t)
    try {
      const instance = this.instantiate(provider)
      const scope = (provider as { scope?: Scope }).scope ?? 'singleton'
      const isValueFunction =
        'useValue' in provider &&
        isFunction((provider as { useValue: T }).useValue)
      if (scope === 'singleton' && !isValueFunction)
        this.singletons.set(t, instance)
      return instance as T
    } finally {
      this.resolving.pop()
    }
  }

  resolveAll<T>(t: Token<T>): T[] {
    const providers = this.providers.get(t) as Provider<T>[] | undefined
    const instances: T[] = []

    if (providers && providers.length > 0) {
      for (const provider of providers) {
        if (this.resolving.includes(t)) {
          const path = [...this.resolving, t].map(describeToken).join(' -> ')
          throw new Error(
            this.logger.error(
              logName,
              'Circular dependency detected: {0}',
              path
            )
          )
        }

        this.resolving.push(t)
        try {
          const instance = this.instantiate(provider)
          instances.push(instance as T)
        } finally {
          this.resolving.pop()
        }
      }
    }

    if (this.parent) {
      instances.push(...this.parent.resolveAll(t))
    }

    return instances
  }

  private instantiate<T>(p: Provider<T>): T {
    if ('useValue' in p) return p.useValue
    if ('useClass' in p) {
      const deps = (p.deps ?? []).map((d) => this.resolve(d))
      return new p.useClass(...deps)
    }
    if ('useFactory' in p) return p.useFactory(this)

    throw new Error(
      this.logger.error(
        logName,
        'Invalid provider for {0}',
        describeToken((p as Provider<T>).token)
      )
    )
  }
}
