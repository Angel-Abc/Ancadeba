// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { services } from '../app/testUtils'
import { PagesContent } from '../../packages/editor/app/content/PagesContent'
import { gameDataStoreProviderToken, type IGameDataStoreProvider } from '../../packages/editor/providers/gameDataStoreProvider'
import { gameDataProviderToken, type IGameDataProvider } from '../../packages/editor/providers/gameDataProvider'
import { messageBusToken, type IMessageBus } from '../../packages/shared/utils/messageBus'
import { pagesValidatorToken, PagesValidator } from '../../packages/editor/app/content/validators/pagesValidator'

describe('PagesContent', () => {
  beforeEach(() => services.clear())

  it('adds and removes pages and updates store', () => {
    const storeProvider = {
      retrieve: vi.fn(() => [{ key: 'start-page', path: 'pages/start-page.json' }]),
      update: vi.fn()
    } as unknown as IGameDataStoreProvider

    const dataProvider = {
      root: { id: 1, game: { pages: { 'start-page': 'pages/start-page.json' } } }
    } as unknown as IGameDataProvider

    const messageBus = {
      postMessage: vi.fn(),
      registerMessageListener: vi.fn(),
      registerNotificationMessage: vi.fn(),
      unregisterNotificationMessage: vi.fn(),
      disableEmptyQueueAfterPost: vi.fn(),
      enableEmptyQueueAfterPost: vi.fn(),
      shutDown: vi.fn()
    } as unknown as IMessageBus

    services.set(gameDataStoreProviderToken, storeProvider)
    services.set(gameDataProviderToken, dataProvider)
    services.set(messageBusToken, messageBus)
    services.set(pagesValidatorToken, new PagesValidator())

    render(<PagesContent id={1} label='Pages' />)

    // Add a page
    fireEvent.change(screen.getByLabelText('new-page-key'), { target: { value: 'main-game' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(storeProvider.update).toHaveBeenLastCalledWith(1, {
      pages: {
        'main-game': 'pages/main-game.json',
        'start-page': 'pages/start-page.json'
      }
    })
    expect(screen.getByText('main-game')).toBeDefined()

    // Remove existing page
    fireEvent.click(screen.getByLabelText('remove-start-page'))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(storeProvider.update).toHaveBeenLastCalledWith(1, {
      pages: {
        'main-game': 'pages/main-game.json'
      }
    })
    expect(screen.queryByText('start-page')).toBeNull()
  })
})
