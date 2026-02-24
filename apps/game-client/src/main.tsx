import { createRoot } from 'react-dom/client'
import { ContainerBuilder } from './builders/containerBuilder'
import { createInstance } from '@ancadeba/utils'
import { IocProvider } from '@ancadeba/ui'
import React from 'react'
import { Engine } from '@ancadeba/engine-ui'
import { bootstrapEngineToken, IBootstrapEngine } from '@ancadeba/engine'

const resourcesDataPath = '/resources'
const containerBuilder = new ContainerBuilder(
  createInstance(),
  resourcesDataPath,
)
const container = containerBuilder.build()

void container.resolve<IBootstrapEngine>(bootstrapEngineToken).execute()

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <IocProvider container={container}>
      <Engine />
    </IocProvider>
  </React.StrictMode>,
)
