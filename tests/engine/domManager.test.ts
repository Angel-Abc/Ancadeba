/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DomManager } from '../../packages/engine/managers/domManager'
import type { ILogger } from '@utils/logger'

describe('DomManager', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('avoids writing duplicate css links', () => {
    const path = '/style.css'
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

    const first = new DomManager(logger)
    first.setCssFile(path)
    first.setCssFile(path)
    expect(document.head.querySelectorAll(`link[href="${path}"]`).length).toBe(1)

    const second = new DomManager(logger)
    second.setCssFile(path)
    expect(document.head.querySelectorAll(`link[href="${path}"]`).length).toBe(1)
  })

  it('does nothing when document is unavailable', () => {
    const path = '/style.css'
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const manager = new DomManager(logger, null)
    expect(() => manager.setCssFile(path)).not.toThrow()
    expect(() => manager.setTitle('test')).not.toThrow()
    expect(document.head.querySelectorAll(`link[href="${path}"]`).length).toBe(0)
  })
})
