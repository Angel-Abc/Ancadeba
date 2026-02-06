import { createRoot } from 'react-dom/client'
import { ContainerBuilder } from './builders/containerBuilder'
import { createInstance } from '@ancadeba/utils'
import { IocProvider } from '@ancadeba/ui'
import React from 'react'
import { bootLoaderToken, IBootLoader } from './services/bootLoader'
import { App } from './app/App'

const resourcesDataPath = '/resources'
const containerBuilder = new ContainerBuilder(
  createInstance(),
  resourcesDataPath,
)
const container = containerBuilder.build()

void container.resolve<IBootLoader>(bootLoaderToken).loadBootScreen()

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <IocProvider container={container}>
      <App />
    </IocProvider>
  </React.StrictMode>,
)
