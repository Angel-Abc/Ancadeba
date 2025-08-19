import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import { ContainerBuilder, IContainerBuilder } from './builders/containerBuilder'
import { ConsoleLogger } from '@utils/logger'
import { IocProvider } from '@ioc/iocProvider'
import { Container } from '@ioc/container'

const containerBuilder: IContainerBuilder = new ContainerBuilder(
  () => new ConsoleLogger()
)
const container: Container = containerBuilder.build()

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <IocProvider container={ container }>
        <App />
      </IocProvider>
    </React.StrictMode>,
  )
}
