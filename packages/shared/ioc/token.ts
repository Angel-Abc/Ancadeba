/**
 * Represents a unique identifier used by the dependency injection container.
 *
 * Tokens are symbols branded with the expected type of the dependency. This allows
 * the container to provide type-safe resolution without relying on string keys.
 *
 * @typeParam T - The type that the token resolves to when retrieved from the container.
 *
 * @example
 * ```ts
 * interface ILogger {
 *     log(message: string): void
 * }
 *
 * const loggerToken = token<ILogger>('logger')
 * ```
 */
export type Token<T> = symbol & { readonly __t?: T }

/**
 * Creates a new dependency injection token.
 *
 * The optional description is only used for debugging and does not affect uniqueness.
 *
 * @param description - Human friendly name shown when inspecting the token.
 * @returns A unique token that can be used to register or resolve a dependency.
 *
 * @example
 * ```ts
 * const schedulerToken = token<IScheduler>('turn-scheduler')
 * container.provide(schedulerToken, new TurnScheduler())
 * ```
 */
export const token = <T>(description?: string): Token<T> =>
  Symbol(description) as Token<T>

/**
 * Retrieves the textual description of a token.
 *
 * @param t - The token to describe.
 * @returns The token description or `"anonymous-token"` when absent.
 *
 * @example
 * ```ts
 * const userToken = token('user')
 * console.log(describeToken(userToken)) // "user"
 * ```
 */
export const describeToken = (t: Token<unknown>): string => t.description ?? 'anonymous-token'
