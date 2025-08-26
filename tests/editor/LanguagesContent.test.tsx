// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { services } from '../app/testUtils'
import { LanguagesContent } from '../../packages/editor/app/content/LanguagesContent'
import { gameDataStoreProviderToken, type IGameDataStoreProvider } from '../../packages/editor/providers/gameDataStoreProvider'

describe('LanguagesContent', () => {
  beforeEach(() => services.clear())

  it('adds and removes languages and updates store', () => {
    const provider = {
      retrieve: vi.fn(() => ['en']),
      update: vi.fn()
    } as unknown as IGameDataStoreProvider
    services.set(gameDataStoreProviderToken, provider)

    render(<LanguagesContent id={1} label='Languages' />)

    // Add a language
    fireEvent.change(screen.getByLabelText('new-language'), { target: { value: 'de' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add language' }))

    expect(provider.update).toHaveBeenLastCalledWith(1, ['en', 'de'])
    expect(screen.getByText('de')).toBeDefined()

    // Remove existing language
    fireEvent.click(screen.getByLabelText('remove-en'))

    expect(provider.update).toHaveBeenLastCalledWith(1, ['de'])
    expect(screen.queryByText('en')).toBeNull()
  })
})
