# Editor Overview

The `editor` directory contains the content authoring tool built with React. It is a standalone application that shares only low-level utilities with the game engine.

## IoC Setup

Dependencies are managed through the shared inversion of control container. [`ContainerBuilder`](../packages/editor/builders/containerBuilder.ts) composes the editor's services by registering utilities, static configuration like the data URL, and the editor-specific builders for core, managers, and providers. `main.tsx` builds the container, supplies it to React's `<IocProvider>`, and resolves the `editor` before calling `start()`.

## Message Flow

The editor relies on the shared [`MessageBus`](../packages/shared/utils/messageBus.ts) for decoupled communication. [`Editor.start()`](../packages/editor/core/editor.ts) posts the `INITIALIZED` message after running initializers. [`GameDataLoaderManager`](../packages/editor/managers/gameDataLoaderManager.ts) listens for this message, loads the game definition, and emits `GAME_DEFINITION_UPDATED`. Providers such as [`GameDataProvider`](../packages/editor/providers/gameDataProvider.ts) send `SET_EDITOR_CONTENT` messages when new content is ready for the UI.

## Separation from the Engine

The editor is intentionally isolated from the runtime engine. Aside from shared modules in `@utils`, `@ioc`, and `@loader/schema`, it avoids importing engine classes or components. This separation keeps the editor focused on authoring while the engine handles gameplay.
