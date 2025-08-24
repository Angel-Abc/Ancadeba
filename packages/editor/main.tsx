import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import { ContainerBuilder, IContainerBuilder } from './builders/containerBuilder'
import { ConsoleLogger } from '@utils/logger'
import { IocProvider } from '@ioc/IocProvider'
import { Container } from '@ioc/container'
import { editorToken, IEditor } from './core/editor'
import './styling/reset.css'
import './styling/variables.css'
import './styling/editor.css'

const containerBuilder: IContainerBuilder = new ContainerBuilder(
  () => new ConsoleLogger(),
  import.meta.env.VITE_DATA_URL ?? 'http://localhost:3000/data'
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

(async () => {
  try {
    const editor = container.resolve<IEditor>(editorToken)
    await editor.start()
  } catch (err) {
    console.error('Editor failed to start', err)
  }
})()
