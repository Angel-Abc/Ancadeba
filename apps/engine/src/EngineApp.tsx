import { useEffect, useState } from 'react'

import { Level, LevelSchema } from '@ancadeba/schemas'
import { invariant } from '@ancadeba/utils'

/**
 * Example engine shell.
 * This will evolve into your actual game runtime.
 */
export function EngineApp() {
  const [levels, setLevels] = useState<Level[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLevels()
      .then(setLevels)
      .catch((err) => {
        console.error(err)
        setError(String(err))
      })
  }, [])

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Engine error</h1>
        <pre>{error}</pre>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Ancadeba Engine</h1>

      {levels.length === 0 ? (
        <p>No levels loaded</p>
      ) : (
        <ul>
          {levels.map((level) => (
            <li key={level.id}>
              {level.name} (difficulty {level.difficulty})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

async function loadLevels(): Promise<Level[]> {
  const base = import.meta.env.DEV
    ? `/@fs/${import.meta.env.VITE_GAME_RESOURCES_DIR}`
    : '/resources'

  const response = await fetch(`${base}/levels/index.json`)

  invariant(response.ok, `Failed to load levels index: ${response.status}`)

  const raw = await response.json()

  if (!Array.isArray(raw)) {
    throw new Error('Levels index must be an array')
  }

  return raw.map((item) => LevelSchema.parse(item))
}
