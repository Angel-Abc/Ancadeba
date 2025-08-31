import { GameModel, gameModelDependencies, gameModelToken } from '@editor/model/GameModel'
import { LanguagesModel, languagesModelDependencies, languagesModelToken } from '@editor/model/LanguagesModel'
import { Container } from '@ioc/container'
import { PagesModel, pagesModelDependencies, pagesModelToken } from '@editor/model/PagesModel'

export class ModelsBuilder {
    public register(container: Container): void {
        container.register({
            token: gameModelToken,
            useClass: GameModel,
            deps: gameModelDependencies
        })
        container.register({
            token: languagesModelToken,
            useClass: LanguagesModel,
            deps: languagesModelDependencies
        })
        container.register({
            token: pagesModelToken,
            useClass: PagesModel,
            deps: pagesModelDependencies
        })
    }
}
