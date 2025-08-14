import { describeToken, type Token } from './token'
import type { Provider, Scope } from './types'
import { fatalError } from '@utils/logMessage'

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

  /**
   * Registers a provider for the given token in the current container.
   *
   * @param provider - Provider configuration describing how the token should be
   *   resolved.
   * @returns The container instance to allow method chaining.
   * @throws Logs and terminates if a provider for the token already exists.
   */
  register<T>(provider: Provider<T>): this {
    if (this.providers.has(provider.token)) {
      fatalError(logName, 'Provider for {0} already registered', describeToken(provider.token))
    }
    this.providers.set(provider.token, provider)
    return this
  }

  /**
   * Registers an array of providers.
   *
   * Each provider is passed to {@link register}. Registration halts on the
   * first duplicate provider because {@link register} throws via `fatalError`.
   *
   * @param providers - Providers to be added to the container.
   * @returns The container instance for chaining.
   */
  registerAll(providers: Provider<unknown>[]): this {
    providers.forEach(p => this.register(p))
    return this
  }

  /**
   * Determines whether a provider for the specified token exists either in
   * this container or any of its ancestors.
   *
   * @param t - Token to look up.
   * @returns `true` if a provider is registered; otherwise `false`.
   */
  has<T>(t: Token<T>): boolean {
    return this.providers.has(t) || !!this.parent?.has(t)
  }

  /**
   * Creates a child container that inherits all providers from the current
   * container but allows overriding or extending them.
   *
   * @returns A newly constructed child container.
   */
  createChild(): Container { return new Container(this) }

  /**
   * Resolves an instance for the given token.
   *
   * - Detects circular dependencies and aborts with a descriptive error when
   *   encountered.
   * - Providers marked with `scope: 'singleton'` are cached so subsequent calls
   *   return the same instance. If the provider uses `useValue` with a function
   *   value, the value is returned directly on each call without caching,
   *   allowing multiple consumers to receive the raw function.
   *
   * @param t - Token identifying the provider.
   * @returns The resolved instance.
   * @throws Logs and terminates if no provider exists or a circular dependency
   *   is detected.
   */
  resolve<T>(t: Token<T>): T {
    if (this.singletons.has(t)) return this.singletons.get(t) as T

    const p = this.providers.get(t) ?? this.parent?.getProvider(t)
    if (!p) fatalError(logName, 'No provider for {0}', describeToken(t))

    if (this.resolving.includes(t)) {
      const path = [...this.resolving, t].map(describeToken).join(' -> ')
      fatalError(logName, 'Circular dependency detected: {0}', path)
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

  /**
   * Instantiates a provider.
   *
   * Handles all supported provider configurations:
   * - `useValue`: returns the supplied value as-is without invoking it.
   * - `useClass`: resolves each dependency and constructs the class.
   * - `useFactory`: invokes the factory with the current container.
   *
   * This method does not perform caching; caller ({@link resolve}) is
   * responsible for handling singleton scope.
   *
   * @param p - Provider description.
   * @returns The instantiated value.
   * @throws Logs and terminates if the provider configuration is invalid.
   */
  private instantiate<T>(p: Provider<T>): T {
    if ('useValue' in p) return p.useValue
    if ('useClass' in p) {
      const deps = (p.deps ?? []).map(d => this.resolve(d))
      return new p.useClass(...deps)
    }
    if ('useFactory' in p) return p.useFactory(this)

    fatalError(logName, 'Invalid provider for {0}', describeToken((p as Provider<T>).token))
  }
}
