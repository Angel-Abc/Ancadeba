import type React from 'react'
import type { Surface } from '@ancadeba/content'
import {
  DataSourceProvider,
  SurfaceRenderer,
  type DataSources,
} from '@ancadeba/engine-ui'

interface BootSurfaceProps {
  surface: Surface | null
  message: string
  progress: number
}

export function BootSurface({
  surface,
  message,
  progress,
}: BootSurfaceProps): React.JSX.Element {
  // If no surface is loaded yet, show a minimal fallback
  if (!surface) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Ancadeba</h1>
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    )
  }

  // Prepare data sources for the surface
  const dataSources: DataSources = {
    'boot:progress': {
      message,
      progress,
    },
  }

  // Use the data-driven surface renderer
  return (
    <DataSourceProvider dataSources={dataSources}>
      <SurfaceRenderer surface={surface}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Ancadeba</h1>
        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#666' }}>
          <div>Surface: {surface.id}</div>
          {surface.tags && <div>Tags: {surface.tags.join(', ')}</div>}
        </div>
      </SurfaceRenderer>
    </DataSourceProvider>
  )
}
