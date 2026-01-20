export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}

export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>
}

export function typedEntries<T extends object>(
  obj: T,
): { [K in keyof T]: [K, T[K]] }[keyof T][] {
  /* // eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return Object.entries(obj) as any
}
