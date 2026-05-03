import { describe, expect, it } from 'vitest'
import { layoutSchema } from '../src/schemas/layout'

describe('layout schema', () => {
  it('rejects fractional grid values', () => {
    // Arrange
    const layout = {
      type: 'grid',
      rows: 1.5,
      columns: 2,
      widgets: [],
    }

    // Act
    const result = layoutSchema.safeParse(layout)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects widgets that exceed grid bounds', () => {
    // Arrange
    const layout = {
      type: 'grid',
      rows: 2,
      columns: 2,
      widgets: [
        {
          widgetId: 'main-title',
          position: {
            row: 1,
            column: 0,
          },
          size: {
            width: 1,
            height: 2,
          },
        },
      ],
    }

    // Act
    const result = layoutSchema.safeParse(layout)

    // Assert
    expect(result.success).toBe(false)
  })
})
