import type React from 'react'

export function GameplaySurface(): React.JSX.Element {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Ancadeba - Gameplay</h1>
      <p>
        The game is ready. This is where the actual gameplay UI will be
        rendered.
      </p>
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
        }}
      >
        <h2>TODO: Implement Gameplay Surface</h2>
        <ul>
          <li>Connect to ECS projections</li>
          <li>Render game world</li>
          <li>Handle player input</li>
          <li>Display UI overlays</li>
        </ul>
      </div>
    </div>
  )
}
