import type React from 'react'

interface ErrorSurfaceProps {
  message: string
}

export function ErrorSurface({
  message,
}: ErrorSurfaceProps): React.JSX.Element {
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
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem', color: '#ff4a4a' }}>
        Error
      </h1>
      <p style={{ color: '#ff8888', maxWidth: '600px', textAlign: 'center' }}>
        {message}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Reload
      </button>
    </div>
  )
}
