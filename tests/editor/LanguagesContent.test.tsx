// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { services } from '../app/testUtils'
import { LanguagesContent } from '../../packages/editor/app/content/LanguagesContent'
import { gameDataStoreProviderToken, type IGameDataStoreProvider } from '../../packages/editor/providers/gameDataStoreProvider'
import { gameDataProviderToken, type IGameDataProvider } from '../../packages/editor/providers/gameDataProvider'
import { languagesValidatorToken, LanguagesValidator } from '../../packages/editor/app/content/validators/languagesValidator'

describe('LanguagesContent', () => {
  beforeEach(() => services.clear())

  it('adds and removes languages and updates store', () => {
    const provider = {
      retrieve: vi.fn(() => ['en']),
      update: vi.fn()
    } as unknown as IGameDataStoreProvider
    const dataProvider = {
      root: { id: 1, game: { languages: { en: [] as string[] } } }
    } as IGameDataProvider
    services.set(gameDataStoreProviderToken, provider)
    services.set(gameDataProviderToken, dataProvider)
    services.set(languagesValidatorToken, new LanguagesValidator())

    render(<LanguagesContent id={1} label='Languages' />)

    // Add a language
    fireEvent.change(screen.getByLabelText('new-language'), { target: { value: 'de' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add language' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(provider.update).toHaveBeenLastCalledWith(1, { languages: { en: [], de: [] } })
    expect(screen.getByText('de')).toBeDefined()

    // Remove existing language
    fireEvent.click(screen.getByLabelText('remove-en'))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(provider.update).toHaveBeenLastCalledWith(1, { languages: { de: [] } })
    expect(screen.queryByText('en')).toBeNull()
  })
})
