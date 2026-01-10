import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadJsonResource } from '../loader'

describe('loader', () => {
  it('loads and validates game JSON', () => {
    // Arrange
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'editor-server-'))
    const filePath = path.join(tempDir, 'game.json')
    const gameData = {
      id: 'game-1',
      name: 'Test Game',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      title: 'Test Game',
      description: 'Test Description',
      version: '1.0.0',
      initialState: {
        scene: 'intro',
      },
      scenes: ['intro'],
      styling: [],
      tileSets: ['outdoor'],
      maps: [],
      virtualKeys: 'virtual-keys',
      virtualInputs: 'virtual-inputs',
      languages: {
        en: {
          name: 'English',
          files: ['system.json'],
        },
      },
      defaultSettings: {
        language: 'en',
        volume: 0.8,
      },
    }
    fs.writeFileSync(filePath, JSON.stringify(gameData), 'utf-8')

    try {
      // Act
      const result = loadJsonResource(filePath, 'game')

      // Assert
      expect(result).toEqual(gameData)
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
