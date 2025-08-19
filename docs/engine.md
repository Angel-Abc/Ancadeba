# Engine Overview

The `engine` directory contains the runtime of the game. It is organized into modules such as [actions](../packages/engine/actions), [core](../packages/engine/core), and [services](../packages/engine/services) that collaborate to drive gameplay.

## IoC Setup

Dependencies are resolved through a lightweight inversion of control container found in [`ioc`](../packages/shared/ioc). Tokens defined in [`token.ts`](../packages/shared/ioc/token.ts) uniquely identify services, while [`container.ts`](../packages/shared/ioc/container.ts) resolves them. The overall container is assembled by [`ContainerBuilder`](../packages/engine/builders/containerBuilder.ts), which wires together subsystems through a collection of specialized builders. `ContainerBuilder` accepts an optional logger or factory and registers it under the `ILogger` token so consumers remain agnostic of the concrete logger implementation.

## Message Flow

Messaging enables decoupled communication. The [`MessageBus`](../packages/shared/utils/messageBus.ts) publishes messages to a queue and notifies registered listeners. System-wide messages defined in [`messages/system.ts`](../packages/engine/messages/system.ts) coordinate high-level events: the initializer dispatches `START_GAME_ENGINE_MESSAGE`, and the [`TurnScheduler`](../packages/engine/core/turnScheduler.ts) progresses turns by emitting `START_END_TURN_MESSAGE` and `FINALIZE_END_TURN_MESSAGE` as the queue empties.

## Builders and Component Registration

Builders in [`builders`](../packages/engine/builders) modularize container configuration:

- `CoreBuilder` registers fundamental infrastructure from [core](../packages/engine/core) including the game engine, message bus, and turn scheduler.
- `ProvidersBuilder` sets up data, configuration, and input providers.
- `LoadersBuilder` wires data loaders for fetching game resources.
- `ServicesBuilder` wires shared utilities exposed under [services](../packages/engine/services).
- `RegistriesBuilder` populates registries for actions, components, and conditions.
- `ManagersBuilder` registers managers that orchestrate engine systems.
- `ActionsBuilder` adds the action executor and built-in actions from [actions](../packages/engine/actions).
- `ConditionsBuilder` registers condition resolvers and default conditions.

The top-level `ContainerBuilder` composes these builders and returns a fully configured container ready for the engine.

## Entry Point

[`engine/main.tsx`](../packages/engine/main.tsx) bootstraps the runtime. It constructs a `ContainerBuilder` with a queue-empty callback for the `TurnScheduler`, the data path, and a logger factory. The resulting `Container` is supplied to React's root through `<IocProvider>`, which wraps `<App />` so components can resolve services. Finally, the entry script retrieves the `gameEngine` from the container and asynchronously calls `start()` to begin processing turns.

