import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ContainerBuilder } from './builders/containerBuilder'
import { ConsoleLogger } from '@angelabc/utils/utils'

const _containerBuilder = new ContainerBuilder(
  new ConsoleLogger()
)

const root = document.getElementById('root')

if (!root) {
  throw new Error('Failed to find the root element')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
