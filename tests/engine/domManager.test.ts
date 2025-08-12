/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DomManager } from '../../engine/managers/domManager'

describe('DomManager', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('avoids writing duplicate css links', () => {
    const path = '/style.css'

    const first = new DomManager()
    first.setCssFile(path)
    first.setCssFile(path)
    expect(document.head.querySelectorAll(`link[href="${path}"]`).length).toBe(1)

    const second = new DomManager()
    second.setCssFile(path)
    expect(document.head.querySelectorAll(`link[href="${path}"]`).length).toBe(1)
  })

  it('does nothing when document is unavailable', () => {
    const path = '/style.css'
    const manager = new DomManager(null)
    expect(() => manager.setCssFile(path)).not.toThrow()
    expect(() => manager.setTitle('test')).not.toThrow()
    expect(document.head.querySelectorAll(`link[href="${path}"]`).length).toBe(0)
  })
})
