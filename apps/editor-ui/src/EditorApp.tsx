import { useEffect, useState } from 'react'

import { Level, LevelSchema } from '@ancadeba/schemas'
import { invariant } from '@ancadeba/utils'

export function EditorApp() {
  const [levels, setLevels] = useState<Level[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLevels()
      .then((nextLevels) => {
        setLevels(nextLevels)
      })
      .catch((err) => {
        console.error(err)
        setError(String(err))
      })
  }, [])

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Editor error</h1>
        <pre>{error}</pre>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Ancadeba Editor</h1>

      {levels.length === 0 ? (
        <p>No levels found</p>
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

/**
 * Load levels via the editor-server API.
 *
 * Note the `/api` prefix — this is proxied by Vite.
 */
async function loadLevels(): Promise<Level[]> {
  const response = await fetch('/api/levels')

  invariant(response.ok, `Failed to load levels: ${response.status}`)

  const raw = await response.json()

  if (!Array.isArray(raw)) {
    throw new Error('Server response must be an array')
  }

  return raw.map((item) => LevelSchema.parse(item))
}
