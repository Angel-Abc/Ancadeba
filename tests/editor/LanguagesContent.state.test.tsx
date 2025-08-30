// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { services } from '../app/testUtils'
import { LanguagesContent } from '../../packages/editor/app/content/LanguagesContent'
import { gameDataStoreProviderToken, type IGameDataStoreProvider } from '../../packages/editor/providers/gameDataStoreProvider'
import { gameDataProviderToken, type IGameDataProvider } from '../../packages/editor/providers/gameDataProvider'
import { messageBusToken, type IMessageBus } from '../../packages/shared/utils/messageBus'

describe('LanguagesContent state management', () => {
  beforeEach(() => services.clear())
  afterEach(() => cleanup())

  const setup = () => {
    const provider = {
      retrieve: vi.fn(() => ['en', 'fr']),
      update: vi.fn()
    } as unknown as IGameDataStoreProvider

    const dataProvider = {
      root: { id: 1, game: { languages: { en: [] as string[], fr: [] as string[] } } }
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

    services.set(gameDataStoreProviderToken, provider)
    services.set(gameDataProviderToken, dataProvider)
    services.set(messageBusToken, messageBus)

    render(<LanguagesContent id={1} label='Languages' />)

    return { provider, dataProvider, messageBus }
  }

  it('resets staged changes and input on cancel', () => {
    setup()

    // Stage: add and remove
    fireEvent.change(screen.getByLabelText('new-language'), { target: { value: 'de' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add language' }))
    fireEvent.click(screen.getByLabelText('remove-fr'))

    // Verify staged state
    expect(screen.getByText('de')).toBeDefined()
    expect(screen.queryByText('fr')).toBeNull()

    // Cancel should revert to original and clear input
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('de')).toBeNull()
    expect(screen.getByText('fr')).toBeDefined()
    expect((screen.getByLabelText('new-language') as HTMLInputElement).value).toBe('')
  })

  it('clears staging after apply and cancel reflects applied root state', () => {
    const { provider } = setup()

    // Stage and apply
    fireEvent.change(screen.getByLabelText('new-language'), { target: { value: 'de' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add language' }))
    fireEvent.click(screen.getByLabelText('remove-fr'))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    // Root should be updated with languages { en: [], de: [] }
    expect(provider.update).toHaveBeenLastCalledWith(1, { languages: { en: [], de: [] } })
    // Reflect UI state
    expect(screen.getByText('de')).toBeDefined()
    expect(screen.queryByText('fr')).toBeNull()
    expect((screen.getByLabelText('new-language') as HTMLInputElement).value).toBe('')

    // Cancel should keep the applied state (not revert to initially retrieved store)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('de')).toBeDefined()
    expect(screen.queryByText('fr')).toBeNull()
  })
})
