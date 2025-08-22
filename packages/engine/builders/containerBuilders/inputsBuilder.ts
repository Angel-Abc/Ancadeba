import { DialogInputs, dialogInputsDependencies, dialogInputsToken } from '@inputs/dialogInputs'
import { PageInputs, pageInputsDependencies, pageInputsToken } from '@inputs/pageInputs'
import { Container } from '@ioc/container'

export class InputsBuilder {
    public register(container: Container): void {
        container.register({
            token: pageInputsToken,
            useClass: PageInputs,
            deps: pageInputsDependencies
        })
        container.register({
            token: dialogInputsToken,
            useClass: DialogInputs,
            deps: dialogInputsDependencies
        })
    }    
}
