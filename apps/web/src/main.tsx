import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Could not find the React root element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
