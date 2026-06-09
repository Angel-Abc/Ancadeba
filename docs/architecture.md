# Architecture

Ancadeba is a TypeScript monorepo for a data-driven game engine. The current runtime loads JSON game resources, validates them, bootstraps engine state, and renders the active game surface through React.

The project is runtime-first today. The editor packages exist, but the meaningful behavior currently lives in the game client, engine, content, engine UI, and shared utilities.

## Workspace Shape

- `apps/game-client`: Vite and React browser runtime for playing a game from resource files.
- `apps/editor-server`: Minimal Express server scaffold for editor-related work.
- `apps/editor-ui`: Minimal editor UI package scaffold.
- `packages/content`: Zod schemas and loaders for game, language, surface, layout, widget, and button resource files.
- `packages/engine`: Bootstrap pipeline, definition providers, translation provider, style loading, and active surface state.
- `packages/engine-ui`: React renderer, layout registry, widget registry, and built-in layout/widget components.
- `packages/ui`: React helpers shared by UI packages, including the IoC provider.
- `packages/utils`: IoC container, tokens, logger, message bus, and resource loading helpers.
- `sample-games/market-value`: Current sample game resources.

## Runtime Flow

The browser runtime starts in `apps/game-client/src/main.tsx`.

1. `ContainerBuilder` creates a shared IoC container.
2. The game client registers services from `utils`, `content`, `engine`, and `engine-ui`.
3. The engine bootstrap service is resolved and executed.
4. React renders `Engine` inside `IocProvider`.
5. `Engine` signals that the UI is ready, listens for language changes, and renders the active `Surface`.
6. `Surface` loads the current surface definition and asks the registered layout renderer to render it.
7. Layout components render `WidgetSlot` elements.
8. `WidgetSlot` loads widget definitions and asks the widget registry to render the matching widget component.

The main dependency direction is:

```text
apps/game-client
  -> packages/ui
  -> packages/engine-ui
  -> packages/engine
  -> packages/content
  -> packages/utils
```

`packages/utils` is intentionally foundational. It should not depend on engine, content, React, or app-specific code.

## Boot Sequence

The engine bootstrap sequence is implemented by `packages/engine/src/bootstrap/bootstrapEngine.ts`.

1. Load `game.json` through the game definition provider.
2. Stop early when no boot surface is configured.
3. Load game-level setup:
   - game styles
   - selected language resources
   - translated game title for logging
4. Preload the configured boot surface.
5. Wait for the React UI to signal readiness.
6. Publish that the boot surface is preloaded.
7. Publish loading progress.
8. Load the remaining game data.
9. Publish final loading progress.
10. Switch to the configured start surface.

The boot process communicates with the UI through the message bus, not direct component calls.

## Rendering Model

Rendering is data-driven:

- `game.json` declares available surfaces, widgets, languages, and styles.
- A surface selects a layout.
- A layout places widget slots.
- A widget definition selects a widget type.
- The UI registry maps layout and widget types to React components.

Current built-in layout types:

- `grid`

Current built-in widget types:

- `progress`
- `title`
- `button-bar`
- `squares-map`

## State And Communication

The current runtime uses a small set of infrastructure primitives:

- IoC container: registers and resolves services by token.
- Message bus: publishes engine/UI events such as progress and surface changes.
- Surface data storage: owns the active surface ID and publishes changes when it updates.
- Translation provider: resolves translation keys from loaded language resources.

This keeps React components mostly dependent on service interfaces instead of global singletons.

## Current Limitations

- The sample game currently demonstrates boot and menu rendering, not actual gameplay.
- The editor packages are scaffolds and do not yet provide a full editing workflow.
- Button actions are handled directly in `ButtonBarWidget`; longer term, action execution should move behind an injected engine service.
- Content files are schema-validated individually, but cross-resource references need stronger validation. Examples include style paths, widget references, and navigation targets.

## Architectural Direction

Prefer changes that preserve these boundaries:

- Content loading and validation belongs in `packages/content`.
- Game runtime behavior belongs in `packages/engine`.
- React rendering belongs in `packages/engine-ui`.
- App bootstrapping belongs in `apps/game-client`.
- Shared infrastructure belongs in `packages/utils`.

When adding behavior, keep data definitions, runtime services, and React rendering as separate responsibilities.
