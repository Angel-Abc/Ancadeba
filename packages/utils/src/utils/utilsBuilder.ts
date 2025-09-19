import { Container } from '../ioc'
import { ILogger, loggerToken } from './logger'

export class UtilsBuilder {
    public register(logger: ILogger, container: Container){
        container.register({
            token: loggerToken,
            useValue: logger
        })
    }
}