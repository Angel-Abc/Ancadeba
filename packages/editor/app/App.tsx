import { useGameSelector } from '@editor/hooks/useGameSelector'

export const App: React.FC = (): React.JSX.Element => {
  const { loading, error, game, dirty } = useGameSelector(s => s)

  if (loading) return <div>Loading game…</div>
  if (error) return <div role="alert">Failed to load: {error}</div>
  if (!game) return <div>No game loaded</div>

  return (
    <div>
      <h1>{game.title}{dirty ? ' *' : ''}</h1>
      <p>{game.description}</p>
      <ul>
        <li>Version: {game.version}</li>
        <li>Pages: {Object.keys(game.pages).length}</li>
        <li>Languages: {Object.keys(game.languages).length}</li>
      </ul>
    </div>
  )
}
