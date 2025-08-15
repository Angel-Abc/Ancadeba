// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { services } from './testUtils'
import { GameMenuComponent } from '@app/controls/component/gameMenuComponent'
import { translationServiceToken, type ITranslationService } from '@services/translationService'
import { actionExecuterToken, type IActionExecuter } from '@actions/actionExecuter'
import { GameMenuComponent as GameMenuComponentData } from '@loader/data/component'

describe('GameMenuComponent', () => {
  beforeEach(() => services.clear())

  it('renders translated buttons and executes action on click', () => {
    const translationService = { translate: vi.fn((label: string) => `tr-${label}`) } as unknown as ITranslationService
    const actionExecuter = { execute: vi.fn() } as unknown as IActionExecuter
    services.set(translationServiceToken, translationService)
    services.set(actionExecuterToken, actionExecuter)

    const component: GameMenuComponentData = {
      type: 'game-menu',
      buttons: [
        { id: Symbol('start'), label: 'start', action: { type: 'script', script: '' } },
      ]
    }

    render(<GameMenuComponent component={component} />)

    const button = screen.getByRole('button', { name: 'tr-start' })
    fireEvent.click(button)

    expect(translationService.translate).toHaveBeenCalledWith('start')
    expect(actionExecuter.execute).toHaveBeenCalledWith(component.buttons[0].action)
  })

  it('renders empty menu when no buttons provided', () => {
    const translationService = { translate: vi.fn() } as unknown as ITranslationService
    const actionExecuter = { execute: vi.fn() } as unknown as IActionExecuter
    services.set(translationServiceToken, translationService)
    services.set(actionExecuterToken, actionExecuter)

    const component: GameMenuComponentData = { type: 'game-menu', buttons: [] }

    const { container } = render(<GameMenuComponent component={component} />)
    expect(container.querySelectorAll('button').length).toBe(0)
  })
})

