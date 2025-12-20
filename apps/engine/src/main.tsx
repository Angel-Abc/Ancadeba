import React from 'react'
import { createRoot } from 'react-dom/client'

import { EngineApp } from './EngineApp'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container not found')
}

const root = createRoot(container)

root.render(
  <React.StrictMode>
    <EngineApp />
  </React.StrictMode>
)
