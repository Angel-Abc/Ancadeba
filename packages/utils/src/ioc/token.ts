export type Token<T> = symbol & { readonly __t?: T }
export const token = <T>(description?: string): Token<T> =>
  Symbol(description) as Token<T>
export const describeToken = (t: Token<unknown>): string =>
  t.description ?? 'anonymous-token'
