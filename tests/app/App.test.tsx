// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { services } from './testUtils'
import { PAGE_SWITCHED } from '@messages/system'
import { messageBusToken, type IMessageBus } from '@utils/messageBus'

vi.mock('@app/controls/Page', () => ({
  Page: ({ pageId }: { pageId: string }) => <div data-testid='page'>{pageId}</div>
}))

import { App } from '@app/App'

describe('App', () => {
  beforeEach(() => services.clear())

  it('renders nothing when no page id received', () => {
    const messageBus = { registerMessageListener: vi.fn() } as unknown as IMessageBus
    services.set(messageBusToken, messageBus)

    const { container } = render(<App />)
    expect(container.innerHTML).toBe('')
    expect(messageBus.registerMessageListener).toHaveBeenCalledWith(PAGE_SWITCHED, expect.any(Function))
  })

  it('renders Page after PAGE_SWITCHED message', () => {
    const listeners = new Map<string, (msg: unknown) => void>()
    const messageBus = {
      registerMessageListener: vi.fn((message: string, handler: (m: unknown) => void) => {
        listeners.set(message, handler)
        return () => {}
      })
    } as unknown as IMessageBus
    services.set(messageBusToken, messageBus)

    render(<App />)
    const cb = listeners.get(PAGE_SWITCHED)
    expect(cb).toBeDefined()
    act(() => {
      cb!({ payload: 'home' })
    })

    expect(screen.getByTestId('page').textContent).toBe('home')
  })
})

