export * from './logger/types'
export * from './checks/typeChecks'
export * from './ioc/types'
export * from './ioc/token'
export * from './ioc/container'

/**
 * Asserts that a value is never reached.
 * Useful for exhaustive checks in switch statements.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}

/**
 * Simple invariant helper.
 */
export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

/**
 * Utility to ensure a value exists.
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}
