import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@app/App'
import { ContainerBuilder, IContainerBuilder } from '@builders/containerBuilder'
import { IocProvider } from './providers/iocProvider'

const containerBuilder: IContainerBuilder = new ContainerBuilder()
const container = containerBuilder.build()

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <IocProvider container={container}>
        <App />
      </IocProvider>
    </React.StrictMode>,
  )
}
