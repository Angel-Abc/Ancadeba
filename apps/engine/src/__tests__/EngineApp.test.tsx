import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { EngineApp } from '../EngineApp'

describe('EngineApp', () => {
  beforeEach(() => {
    // Arrange: mock fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'level-1',
          name: 'Tutorial',
          type: 'level',
          difficulty: 1,
          mapFile: 'tutorial.map',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    } as Response)
  })

  it('renders levels returned from fetch', async () => {
    // Act
    render(<EngineApp />)

    // Assert (async render)
    await waitFor(() => {
      expect(screen.getByText('Tutorial (difficulty 1)')).toBeInTheDocument()
    })
  })
})
