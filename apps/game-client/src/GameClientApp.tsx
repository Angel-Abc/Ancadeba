/**
 * Example game client shell.
 * This will evolve into your actual game runtime.
 */
export function GameClientApp(): React.JSX.Element {
  return (
    <div style={{ padding: 16 }}>
      <h1>Ancadeba Game Client</h1>
      <p>TODO</p>
    </div>
  )
}

// async function loadLevels(): Promise<Level[]> {
//   const base = import.meta.env.DEV
//     ? `/@fs/${import.meta.env.VITE_GAME_RESOURCES_DIR}`
//     : '/resources'

//   const response = await fetch(`${base}/levels/index.json`)

//   invariant(response.ok, `Failed to load levels index: ${response.status}`)

//   const raw = await response.json()

//   if (!Array.isArray(raw)) {
//     throw new Error('Levels index must be an array')
//   }

//   return raw.map((item) => LevelSchema.parse(item))
// }
