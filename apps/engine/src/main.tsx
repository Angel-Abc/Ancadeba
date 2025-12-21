import React from 'react'
import { createRoot } from 'react-dom/client'
import { EngineApp } from './EngineApp'
import { ContainerBuilder } from './builders/containerBuilder'
import { ConsoleLogger } from '@ancadeba/utils'
import { IocProvider } from '@ancadeba/ui'

const resourcesDataPath = import.meta.env.DEV
  ? `/@fs/${import.meta.env.VITE_GAME_RESOURCES_DIR}`
  : '/resources'

const containerBuilder = new ContainerBuilder(
  new ConsoleLogger(),
  resourcesDataPath
)
export const container = containerBuilder.build()

const rootContainer = document.getElementById('root')

if (!rootContainer) {
  throw new Error('Root container not found')
}

const root = createRoot(rootContainer)

root.render(
  <React.StrictMode>
    <IocProvider container={container}>
      <EngineApp />
    </IocProvider>
  </React.StrictMode>
)
