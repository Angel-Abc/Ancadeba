import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { EditorApp } from '../EditorApp'

describe('EditorApp', () => {
  beforeEach(() => {
    // Arrange: mock fetch for API call
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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

  it('renders levels returned from the API', async () => {
    // Act
    render(<EditorApp />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Tutorial (difficulty 1)')).toBeInTheDocument()
    })
  })
})
