import type React from 'react'

interface BootSurfaceProps {
  message: string
  progress: number
}

export function BootSurface({
  message,
  progress,
}: BootSurfaceProps): React.JSX.Element {
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
      <div
        style={{
          width: '400px',
          height: '4px',
          backgroundColor: '#333',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: '#4a9eff',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <p style={{ marginTop: '1rem', color: '#888' }}>{message}</p>
    </div>
  )
}
