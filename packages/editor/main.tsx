import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConsoleLogger, loggerToken } from '@utils/logger'
import { IocProvider } from '@ioc/IocProvider'
import { Container } from '@ioc/container'
import './styling/reset.css'
import './styling/variables.css'
import './styling/editor.css'
import { IRootBuilder, RootBuilder } from './builders/rootBuilder'
import { editorToken, IEditor } from './core/editor'
import { App } from './app/App'

const logName = 'main'
const builder: IRootBuilder = new RootBuilder(
  () => new ConsoleLogger(),
  import.meta.env.VITE_DATA_URL ?? 'http://localhost:3000/data'
)
const container: Container = builder.build()

const rootElement = document.getElementById('root')
if (rootElement) {
  rootElement.className = 'root'
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
    const logger = container.resolve(loggerToken)
    logger.error(logName, 'Editor failed to start: {0}', err)
  }
})()
