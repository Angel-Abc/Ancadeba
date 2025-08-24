import { vi } from 'vitest'

export const services = new Map<unknown, unknown>()

vi.mock('@ioc/IocProvider', () => ({
  useService: (token: unknown, _logger?: unknown) => (void _logger, services.get(token))
}))

