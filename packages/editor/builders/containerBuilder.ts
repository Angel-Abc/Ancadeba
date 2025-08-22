import { Editor, editorDependencies, editorToken } from '@editor/core/editor'
import { EditorInitializer, editorInitializerDependencies, editorInitializerToken } from '@editor/core/editorInitializer'
import { GameDefinitionLoaderManager, gameDefinitionLoaderManagerDependencies, gameDefinitionLoaderManagerToken, dataUrlToken } from '@editor/managers/gameDefinitionManager'
import { EditTreeProvider, editTreeProviderDependencies, editTreeProviderToken } from '@editor/providers/editTreeProvider'
import { GameDefinitionProvider, gameDefinitionProviderDependencies, gameDefinitionProviderToken } from '@editor/providers/gameDefinitionProvider'
import { Container } from '@ioc/container'
import { ILogger } from '@utils/logger'
import { UtilsBuilder } from '../../shared/builder/utilsBuilder'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private loggerFactory: () => ILogger,
        private dataUrl: string
    ) { }

    public build(): Container {
        const logger = this.loggerFactory()
        const result = new Container(logger)
        new UtilsBuilder(logger, () => () => {}).register(result)
        result.register({
            token: editorToken,
            useClass: Editor,
            deps: editorDependencies
        })
        result.register({
            token: editorInitializerToken,
            useClass: EditorInitializer,
            deps: editorInitializerDependencies
        })
        result.register({
            token: dataUrlToken,
            useValue: this.dataUrl
        })
        result.register({
            token: gameDefinitionLoaderManagerToken,
            useClass: GameDefinitionLoaderManager,
            deps: gameDefinitionLoaderManagerDependencies
        })
        result.register({
            token: gameDefinitionProviderToken,
            useClass: GameDefinitionProvider,
            deps: gameDefinitionProviderDependencies
        })
        result.register({
            token: editTreeProviderToken,
            useClass: EditTreeProvider,
            deps: editTreeProviderDependencies
        })
        return result
    }
}
