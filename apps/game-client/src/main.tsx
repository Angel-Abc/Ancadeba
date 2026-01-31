import React from 'react'
import { createRoot } from 'react-dom/client'

import { GameClientApp } from './GameClientApp'
import { ContainerBuilder } from './builders/container'
import { registerWidgets } from './helpers/widgetRegistration'

import { createInstance } from '@ancadeba/utils'
import { IocProvider } from '@ancadeba/ui'
import { widgetRegistryToken, type IWidgetRegistry } from '@ancadeba/engine-ui'

import './styling/reset.css'
import './styling/variables.css'
import './styling/game-client.css'

// const logName = 'game-client/src/main'
const resourcesDataPath = import.meta.env.DEV
  ? `/@fs/${import.meta.env.VITE_GAME_RESOURCES_DIR}`
  : '/resources'
const containerBuilder = new ContainerBuilder(
  createInstance(),
  resourcesDataPath,
)
const servicesContainer = containerBuilder.build()

// Register widgets with the widget registry
const widgetRegistry =
  servicesContainer.resolve<IWidgetRegistry>(widgetRegistryToken)
registerWidgets(widgetRegistry)

const rootContainer = document.getElementById('root')

if (!rootContainer) {
  throw new Error('Root container not found')
}

const root = createRoot(rootContainer)

root.render(
  <React.StrictMode>
    <IocProvider container={servicesContainer}>
      <GameClientApp />
    </IocProvider>
  </React.StrictMode>,
)
