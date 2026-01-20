export function EditorApp(): React.JSX.Element {
  return (
    <div style={{ padding: 16 }}>
      <h1>Ancadeba Editor</h1>
      <p>TODO</p>
    </div>
  )
}

// /**
//  * Load levels via the editor-server API.
//  *
//  * Note the `/api` prefix — this is proxied by Vite.
//  */
// async function loadLevels(): Promise<Level[]> {
//   const response = await fetch('/api/levels')

//   invariant(response.ok, `Failed to load levels: ${response.status}`)

//   const raw = await response.json()

//   if (!Array.isArray(raw)) {
//     throw new Error('Server response must be an array')
//   }

//   return raw.map((item) => LevelSchema.parse(item))
// }
