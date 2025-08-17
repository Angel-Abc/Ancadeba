# Engine Overview

The `engine` directory contains the runtime of the game. It is organized into modules such as [actions](../engine/actions), [core](../engine/core), and [services](../engine/services) that collaborate to drive gameplay.

## IoC Setup

Dependencies are resolved through a lightweight inversion of control container found in [`ioc`](../engine/ioc). Tokens defined in [`token.ts`](../engine/ioc/token.ts) uniquely identify services, while [`container.ts`](../engine/ioc/container.ts) resolves them. The overall container is assembled by [`ContainerBuilder`](../engine/builders/containerBuilder.ts), which wires together subsystems through a collection of specialized builders.

## Message Flow

Messaging enables decoupled communication. The [`MessageBus`](../utils/messageBus.ts) publishes messages to a queue and notifies registered listeners. System-wide messages defined in [`messages/system.ts`](../engine/messages/system.ts) coordinate high-level events: the initializer dispatches `START_GAME_ENGINE_MESSAGE`, and the [`TurnScheduler`](../engine/core/turnScheduler.ts) progresses turns by emitting `START_END_TURN_MESSAGE` and `FINALIZE_END_TURN_MESSAGE` as the queue empties.

## Builders and Component Registration

Builders in [`builders`](../engine/builders) modularize container configuration:

- `CoreBuilder` registers fundamental infrastructure from [core](../engine/core) including the game engine, message bus, and turn scheduler.
- `ActionsBuilder` adds the action executor and built-in actions from [actions](../engine/actions).
- `ServicesBuilder` wires shared utilities exposed under [services](../engine/services).
- Additional builders register providers, managers, registries, and conditions.

The top-level `ContainerBuilder` composes these builders and returns a fully configured container ready for the engine.

