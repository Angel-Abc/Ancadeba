// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { services } from './testUtils'
import { GameMenu } from '@app/controls/component/gameMenu'
import { translationServiceToken, type ITranslationService } from '@services/translationService'
import { actionExecutorToken, type IActionExecutor } from '@actions/actionExecutor'
import { GameMenuComponent } from '@loader/data/component'

describe('GameMenuComponent', () => {
  beforeEach(() => services.clear())

  it('renders translated buttons and executes action on click', () => {
    const translationService = { translate: vi.fn((label: string) => `tr-${label}`) } as unknown as ITranslationService
    const actionExecutor = { execute: vi.fn() } as unknown as IActionExecutor
    services.set(translationServiceToken, translationService)
    services.set(actionExecutorToken, actionExecutor)

    const component: GameMenuComponent = {
      type: 'game-menu',
      buttons: [
        { id: Symbol('start'), label: 'start', action: { type: 'script', script: '' } },
      ]
    }

    render(<GameMenu component={component} />)

    const button = screen.getByRole('button', { name: 'tr-start' })
    fireEvent.click(button)

    expect(translationService.translate).toHaveBeenCalledWith('start')
    expect(actionExecutor.execute).toHaveBeenCalledWith(component.buttons[0].action)
  })

  it('renders empty menu when no buttons provided', () => {
    const translationService = { translate: vi.fn() } as unknown as ITranslationService
    const actionExecutor = { execute: vi.fn() } as unknown as IActionExecutor
    services.set(translationServiceToken, translationService)
    services.set(actionExecutorToken, actionExecutor)

    const component: GameMenuComponent = { type: 'game-menu', buttons: [] }

    const { container } = render(<GameMenu component={component} />)
    expect(container.querySelectorAll('button').length).toBe(0)
  })
})

