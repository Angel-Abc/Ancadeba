import { GameEngine, gameEngineDependencies, gameEngineToken } from '@engine/gameEngine'
import { TurnScheduler, turnSchedulerDependencies, turnSchedulerToken } from '@engine/turnScheduler'
import { Container } from '@ioc/container'
import type { Container as IContainer } from '@ioc/types'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'
import { GameLoader, gameLoaderToken } from '@loader/gameLoader'
import { LanguageLoader, languageLoaderDependencies, languageLoaderToken } from '@loader/languageLoader'
import { EngineInitializer, engineInitializerDependencies, engineInitializerToken } from '@engine/engineInitializer'
import { PageLoader, pageLoaderDependencies, pageLoaderToken } from '@loader/pageLoader'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '@providers/gameDataProvider'
import { TranslationService, translationServiceToken } from '@services/translationService'
import { DomManager, domManagerDependencies, domManagerToken } from '@managers/domManager'
import { LanguageManager, languageManagerDependencies, languageManagerToken } from '@managers/languageManager'
import { PageManager, pageManagerDependencies, pageManagerToken } from '@managers/pageManager'
import { ServiceProvider, serviceProviderToken } from '@providers/serviceProvider'
import { ActionHandlerRegistry, actionHandlerRegistryDependencies, actionHandlerRegistryToken } from '@registries/actionHandlerRegistry'
import { ConditionResolverRegistry, conditionResolverRegistryDependencies, conditionResolverRegistryToken } from '@registries/conditionResolverRegistry'
import { ComponentRegistry, componentRegistryDependencies, componentRegistryToken } from '@registries/componentRegistry'
import { ActionExecuter, actionExecuterDependencies, actionExecuterToken } from '@actions/actionExecuter'
import { PostMessageAction, PostMessageActionDependencies, postMessageActionToken } from '@actions/postMessageAction'
import { ActionHandlersLoader, actionHandlersLoaderDependencies, actionHandlersLoaderToken } from '@loader/actionHandlersLoader'
import { ActionManager, actionManagerDependencies, actionManagerToken } from '@managers/actionManager'
import { GameMapLoader, gameMapLoaderDependencies, gameMapLoaderToken } from '@loader/gameMapLoader'
import { TileSetLoader, tileSetLoaderDependencies, tileSetLoaderToken } from '@loader/tileSetLoader'
import { MapManager, mapManagerDependencies, mapManagerToken } from '@managers/mapManager'
import { VirtualKeysLoader, virtualKeysLoaderDependencies, virtualKeysLoaderToken } from '@loader/virtualKeysLoader'
import { KeyboardEventListener, keyboardeventListenerDependencies, keyboardeventListenerToken } from '@utils/keyboardEventListener'
import { VirtualKeyProvider, virtualKeyProviderDependencies, virtualKeyProviderToken } from '@providers/virtualKeyProvider'
import { VirtualInputsLoader, virtualInputsLoaderDependencies, virtualInputsLoaderToken } from '@loader/virtualInputsLoader'
import { VirtualInputProvider, virtualInputProviderDependencies, virtualInputProviderToken } from '@providers/virtualInputProvider'

/**
 * Builder abstraction for creating and configuring a dependency injection container.
 */
export interface IContainerBuilder {
    /**
     * Construct and configure a service container.
     *
     * @returns A fully configured container instance.
     */
    build(): Container
}

/**
 * Wires together all engine components using dependency injection.
 */
export class ContainerBuilder implements IContainerBuilder {
    /**
     * @param onQueueEmptyProvider Factory for creating callbacks when the message queue empties.
     * @param dataPath Base path for loading game data resources.
     */
    constructor(
        private onQueueEmptyProvider: (container: IContainer) => () => void = () => () => {},
        private dataPath: string = process.env.DATA_PATH ?? '/data',
    ) {}

    /**
     * Build and configure the dependency container.
     *
     * @returns Populated container instance.
     * @remarks Mutates the new container by registering all engine services.
     */
    public build(): Container {
        const result = new Container()
        this.registerCore(result)
        this.registerProviders(result)
        this.registerLoaders(result)
        this.registerServices(result)
        this.registerRegistries(result)
        this.registerManagers(result)
        this.registerActions(result)
        // Hook for custom service registrations
        return result
    }

    /**
     * Register core engine dependencies including the turn scheduler, message
     * queue, message bus, engine initializer, and the game engine itself.
     *
     * @param container Container to receive registrations.
     * @remarks Mutates the provided container.
     */
    private registerCore(container: Container): void {
        container.register({
            token: turnSchedulerToken,
            useClass: TurnScheduler,
            deps: turnSchedulerDependencies
        })
        container.register({
            token: messageQueueToken,
            useFactory: (c) => new MessageQueue(this.onQueueEmptyProvider(c))
        })
        container.register({
            token: messageBusToken,
            useClass: MessageBus,
            deps: messageBusDependencies
        })
        container.register({
            token: engineInitializerToken,
            useClass: EngineInitializer,
            deps: engineInitializerDependencies
        })
        container.register({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
        container.register({
            token: keyboardeventListenerToken,
            useClass: KeyboardEventListener,
            deps: keyboardeventListenerDependencies
        })
    }

    private registerActions(container: Container): void {
        container.register({
            token: actionExecuterToken,
            useClass: ActionExecuter,
            deps: actionExecuterDependencies
        })
        container.register({
            token: postMessageActionToken,
            useClass: PostMessageAction,
            deps: PostMessageActionDependencies,
            scope: 'transient'
        })
    }

    /**
     * Register provider-related services like configuration and data providers.
     *
     * @param container Container to receive registrations.
     * @remarks Mutates the provided container.
     */
    private registerProviders(container: Container): void {
        container.register({
            token: serviceProviderToken,
            useFactory: c => new ServiceProvider(c)
        })
        container.register<IDataPathProvider>({
            token: dataPathProviderToken,
            useValue: { dataPath: this.dataPath }
        })
        container.register({
            token: gameDataProviderToken,
            useClass: GameDataProvider,
            deps: gameDataProviderDependencies
        })
        container.register({
            token: virtualKeyProviderToken,
            useClass: VirtualKeyProvider,
            deps: virtualKeyProviderDependencies
        })
        container.register({
            token: virtualInputProviderToken,
            useClass: VirtualInputProvider,
            deps: virtualInputProviderDependencies
        })
    }

    /**
     * Register loaders responsible for fetching game, language and page data.
     *
     * @param container Container to receive registrations.
     * @remarks Mutates the provided container.
     */
    private registerLoaders(container: Container): void {
        container.register({
            token: gameLoaderToken,
            useClass: GameLoader,
            deps: [dataPathProviderToken]
        })
        container.register({
            token: languageLoaderToken,
            useClass: LanguageLoader,
            deps: languageLoaderDependencies
        })
        container.register({
            token: pageLoaderToken,
            useClass: PageLoader,
            deps: pageLoaderDependencies
        })
        container.register({
            token: actionHandlersLoaderToken,
            useClass: ActionHandlersLoader,
            deps: actionHandlersLoaderDependencies
        })
        container.register({
            token: gameMapLoaderToken,
            useClass: GameMapLoader,
            deps: gameMapLoaderDependencies
        })
        container.register({
            token: tileSetLoaderToken,
            useClass: TileSetLoader,
            deps: tileSetLoaderDependencies
        })
        container.register({
            token: virtualKeysLoaderToken,
            useClass: VirtualKeysLoader,
            deps: virtualKeysLoaderDependencies
        })
        container.register({
            token: virtualInputsLoaderToken,
            useClass: VirtualInputsLoader,
            deps: virtualInputsLoaderDependencies
        })
    }

    /**
     * Register application services such as translation.
     *
     * @param container Container to receive registrations.
     * @remarks Mutates the provided container.
     */
    private registerServices(container: Container): void {
        container.register({
            token: translationServiceToken,
            useClass: TranslationService,
            deps: []
        })
    }

    /**
     * Register registries used for dynamic lookups such as action handlers.
     *
     * @param container Container to receive registrations.
     * @remarks Mutates the provided container.
     */
    private registerRegistries(container: Container): void {
        container.register({
            token: actionHandlerRegistryToken,
            useClass: ActionHandlerRegistry,
            deps: actionHandlerRegistryDependencies
        })
        container.register({
            token: conditionResolverRegistryToken,
            useClass: ConditionResolverRegistry,
            deps: conditionResolverRegistryDependencies
        })
        container.register({
            token: componentRegistryToken,
            useClass: ComponentRegistry,
            deps: componentRegistryDependencies
        })
    }

    /**
     * Register manager classes that orchestrate DOM, language and pages.
     *
     * @param container Container to receive registrations.
     * @remarks Mutates the provided container.
     */
    private registerManagers(container: Container): void {
        container.register({
            token: domManagerToken,
            useClass: DomManager,
            deps: domManagerDependencies,
            scope: 'transient'
        })
        container.register({
            token: languageManagerToken,
            useClass: LanguageManager,
            deps: languageManagerDependencies
        })
        container.register({
            token: pageManagerToken,
            useClass: PageManager,
            deps: pageManagerDependencies
        })
        container.register({
            token: actionManagerToken,
            useClass: ActionManager,
            deps: actionManagerDependencies
        })
        container.register({
            token: mapManagerToken,
            useClass: MapManager,
            deps: mapManagerDependencies
        })
    }
}
