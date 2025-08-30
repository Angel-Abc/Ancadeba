import { GameJsonSaver, gameJsonSaverDependencies, gameJsonSaverToken } from '@editor/savers/gameJsonSaver'
import { Container } from '@ioc/container'

export class SaversBuilder {
    public register(container: Container): void {
        container.register({
            token: gameJsonSaverToken,
            useClass: GameJsonSaver,
            deps: gameJsonSaverDependencies
        })
    }    
}
