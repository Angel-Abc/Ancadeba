import { Editor, editorDependencies, editorToken } from '@editor/core/editor'
import { EditorInitializer, editorInitializerDependencies, editorInitializerToken } from '@editor/core/editorInitializer'
import { GameModel, gameModelDependencies, gameModelToken } from '@editor/model/gameModel'
import { Container } from '@ioc/container'

export class CoreBuilder {
    public register(container: Container): void {
        container.register({
            token: editorToken,
            useClass: Editor,
            deps: editorDependencies
        })
        container.register({
            token: gameModelToken,
            useClass: GameModel,
            deps: gameModelDependencies
        })
        container.register({
            token: editorInitializerToken,
            useClass: EditorInitializer,
            deps: editorInitializerDependencies
        })
    }
}
