import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('GET /api/levels', () => {
  let tempDir: string

  beforeEach(() => {
    // Arrange
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'game-resources-'))

    const levelsDir = path.join(tempDir, 'levels')
    fs.mkdirSync(levelsDir)

    const level = {
      id: 'level-1',
      name: 'Tutorial',
      type: 'level',
      difficulty: 1,
      mapFile: 'tutorial.map',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    fs.writeFileSync(
      path.join(levelsDir, 'level-1.json'),
      JSON.stringify(level, null, 2)
    )

    // Point server to temp directory
    process.env.GAME_RESOURCES_DIR = tempDir
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
    delete process.env.GAME_RESOURCES_DIR
    delete process.env.NODE_ENV
  })

  it('returns all levels', async () => {
    // Arrange
    const { app } = await import('../index')

    // Act
    const response = await request(app).get('/api/levels')

    // Assert
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].id).toBe('level-1')
    expect(response.body[0].name).toBe('Tutorial')
  })
})
