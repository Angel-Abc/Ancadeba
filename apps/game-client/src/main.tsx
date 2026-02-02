import { createRoot } from 'react-dom/client'
import { ContainerBuilder } from './builders/containerBuilder'
import { createInstance } from '@ancadeba/utils'
import { IocProvider } from '@ancadeba/ui'
import React from 'react'

const resourcesDataPath = import.meta.env.DEV
  ? `/@fs/${import.meta.env.VITE_GAME_RESOURCES_DIR}`
  : '/resources'
const containerBuilder = new ContainerBuilder(
  createInstance(),
  resourcesDataPath,
)
const container = containerBuilder.build()

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <IocProvider container={container}>
      <div>Hello, Ancadeba Game Client!</div>
    </IocProvider>
  </React.StrictMode>,
)
