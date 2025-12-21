import { isFunction } from '../checks/typeChecks'
import { ILogger } from '../logger/types'
import { describeToken, Token } from './token'
import { IContainer, Provider, Scope } from './types'

const logName: string = 'utils/ioc/container'

export class Container implements IContainer {
  private providers = new Map<Token<unknown>, Provider<unknown>>()
  private singletons = new Map<Token<unknown>, unknown>()
  private resolving: Token<unknown>[] = []
  readonly parent?: Container

  constructor(private logger: ILogger, parent?: Container) {
    this.parent = parent
  }

  register<T>(provider: Provider<T>): this {
    if (this.providers.has(provider.token)) {
      throw new Error(
        this.logger.error(
          logName,
          'Provider for {0} already registered',
          describeToken(provider.token)
        )
      )
    }
    this.providers.set(provider.token, provider)
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
    const provider = this.providers.get(t) as Provider<T> | undefined
    if (!provider) {
      if (this.parent) return this.parent.resolve(t)
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
