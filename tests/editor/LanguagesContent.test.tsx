// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { services } from '../app/testUtils'
import { LanguagesContent } from '../../packages/editor/app/content/LanguagesContent'
import { gameDataStoreProviderToken, type IGameDataStoreProvider } from '../../packages/editor/providers/gameDataStoreProvider'
import { gameDataProviderToken, type IGameDataProvider } from '../../packages/editor/providers/gameDataProvider'
import { messageBusToken, type IMessageBus } from '../../packages/shared/utils/messageBus'

describe('LanguagesContent', () => {
  beforeEach(() => services.clear())

  it('adds and removes languages and updates store on apply', () => {
    const storeProvider = {
      retrieve: vi.fn(() => ['en']),
      update: vi.fn()
    } as unknown as IGameDataStoreProvider
    services.set(gameDataStoreProviderToken, storeProvider)

    const root = {
      type: 'root',
      id: 1,
      label: 'root',
      game: { languages: { en: [] }, pages: {} },
      children: []
    }
    const gameProvider = {
      root,
      refreshLanguages: vi.fn()
    } as unknown as IGameDataProvider
    services.set(gameDataProviderToken, gameProvider)

    const bus = {
      postMessage: vi.fn()
    } as unknown as IMessageBus
    services.set(messageBusToken, bus)

    render(<LanguagesContent id={1} label='Languages' />)

    // Add a language
    fireEvent.change(screen.getByLabelText('new-language'), { target: { value: 'de' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add language' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(storeProvider.update).toHaveBeenLastCalledWith(1, root.game)
    expect(root.game.languages).toHaveProperty('de')
    expect(screen.getByText('de')).toBeDefined()

    // Remove existing language
    fireEvent.click(screen.getByLabelText('remove-en'))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(storeProvider.update).toHaveBeenLastCalledWith(1, root.game)
    expect(root.game.languages).not.toHaveProperty('en')
    expect(screen.queryByText('en')).toBeNull()
  })
})
