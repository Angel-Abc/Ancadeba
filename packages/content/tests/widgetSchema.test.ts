import { describe, expect, it } from 'vitest'
import { widgetSchema } from '../src/schemas/widget'

describe('widget schema', () => {
  it('accepts valid squares maps', () => {
    // Arrange
    const widget = {
      widgetId: 'mini-map',
      type: 'squares-map',
      viewportWidth: 5,
      viewportHeight: 5,
      track: 'player',
    }

    // Act
    const result = widgetSchema.safeParse(widget)

    // Assert
    expect(result.success).toBe(true)
  })

  it('rejects squares maps with invalid track values', () => {
    // Arrange
    const widget = {
      widgetId: 'mini-map',
      type: 'squares-map',
      viewportWidth: 5,
      viewportHeight: 5,
      track: 'camera',
    }

    // Act
    const result = widgetSchema.safeParse(widget)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects squares maps with zero viewport dimensions', () => {
    // Arrange
    const widget = {
      widgetId: 'mini-map',
      type: 'squares-map',
      viewportWidth: 0,
      viewportHeight: 5,
      track: 'player',
    }

    // Act
    const result = widgetSchema.safeParse(widget)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects squares maps with fractional viewport dimensions', () => {
    // Arrange
    const widget = {
      widgetId: 'mini-map',
      type: 'squares-map',
      viewportWidth: 5.5,
      viewportHeight: 5,
      track: 'player',
    }

    // Act
    const result = widgetSchema.safeParse(widget)

    // Assert
    expect(result.success).toBe(false)
  })
})
