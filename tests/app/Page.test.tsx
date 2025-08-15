// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { services } from './testUtils'
import { gameDataProviderToken, type IGameDataProvider } from '@providers/gameDataProvider'

vi.mock('@app/controls/screen/screen', () => ({
  Screen: ({ screen }: { screen: string }) => <div data-testid='screen'>{screen}</div>
}))

import { Page } from '@app/controls/page'

describe('Page', () => {
  beforeEach(() => services.clear())

  it('renders nothing when current page does not match', () => {
    const provider = {
      Context: { currentPageId: 'other' },
      Game: { loadedPages: { my: { screen: 'scr' } } }
    } as unknown as IGameDataProvider
    services.set(gameDataProviderToken, provider)

    const { container } = render(<Page pageId='my' />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when page data is missing', () => {
    const provider = {
      Context: { currentPageId: 'my' },
      Game: { loadedPages: {} }
    } as unknown as IGameDataProvider
    services.set(gameDataProviderToken, provider)

    const { container } = render(<Page pageId='my' />)
    expect(container.innerHTML).toBe('')
  })

  it('renders screen for loaded current page', () => {
    const provider = {
      Context: { currentPageId: 'my' },
      Game: { loadedPages: { my: { screen: 'scr' } } }
    } as unknown as IGameDataProvider
    services.set(gameDataProviderToken, provider)

    render(<Page pageId='my' />)
    expect(screen.getByTestId('screen').textContent).toBe('scr')
  })
})

