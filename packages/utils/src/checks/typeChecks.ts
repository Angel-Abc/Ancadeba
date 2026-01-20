export function isFunction(v: unknown): v is (...args: unknown[]) => unknown {
  return typeof v === 'function'
}
