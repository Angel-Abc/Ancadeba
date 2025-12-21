import { Container } from '../ioc/container'
import { ILogger, loggerToken } from '../logger/types'

export function registerServices(container: Container, logger: ILogger): void {
  container.register({
    token: loggerToken,
    useValue: logger,
  })
}
