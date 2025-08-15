import { vi } from 'vitest'

export const services = new Map<unknown, unknown>()

vi.mock('@app/iocProvider', () => ({
  useService: (token: unknown) => services.get(token)
}))

