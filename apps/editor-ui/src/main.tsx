import React from 'react'
import { createRoot } from 'react-dom/client'

import { EditorApp } from './EditorApp'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container not found')
}

const root = createRoot(container)

root.render(
  <React.StrictMode>
    <EditorApp />
  </React.StrictMode>,
)
