# Development

This document captures the current local workflow for the Ancadeba monorepo.

## Prerequisites

- Node.js compatible with the checked-in dependencies.
- PNPM. The root `package.json` declares the package manager version.

Install dependencies from the repository root:

```powershell
pnpm install
```

## Environment

The root `.env` file is ignored by Git. The game client and editor server read environment values from the monorepo root.

Common values:

```text
VITE_GAME_RESOURCES_DIR=sample-games/market-value
PORT=3000
```

`VITE_GAME_RESOURCES_DIR` points at the active game resource root. The game client serves it at `/resources` in development and copies it to `apps/game-client/dist/resources` during production builds.

`PORT` is used by the editor server when no explicit port is provided.

## Common Commands

Run all package dev scripts:

```powershell
pnpm dev
```

Run the game client only:

```powershell
pnpm --filter @ancadeba/game-client dev
```

Run the editor server only:

```powershell
pnpm --filter @ancadeba/editor-server dev
```

Run the required checks:

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

These checks should pass before considering a code task complete.

## Package Scripts

The root scripts run recursively across workspace packages:

- `pnpm dev`: Runs package dev scripts in parallel when present.
- `pnpm typecheck`: Runs TypeScript checking across packages.
- `pnpm lint`: Runs ESLint across packages.
- `pnpm build`: Builds packages and the game client.
- `pnpm test`: Runs Vitest across packages.

Some packages use `--passWithNoTests`, so a package can be healthy while it still has no tests. Add focused tests when behavior is introduced or changed.

## Coding Conventions

Follow the project-level agent instructions:

- Use single quotes for strings.
- Omit semicolons.
- Prefer dependency injection over global singletons.
- Keep modules and classes focused on a single responsibility.
- Use Arrange/Act/Assert comments in tests.

## Adding Runtime Services

When adding a service:

1. Define the public interface in the package that owns the behavior.
2. Define a token for the service.
3. Implement the service behind the interface.
4. Export the interface and token through the package index.
5. Register the implementation in that package's IoC helper.
6. Resolve the service by token from consumers.
7. Add tests for behavior and IoC wiring.

Keep package ownership clear:

- Shared infrastructure goes in `packages/utils`.
- Content schemas and file loading go in `packages/content`.
- Engine behavior goes in `packages/engine`.
- React rendering goes in `packages/engine-ui`.
- App composition goes in `apps/game-client`.

## Adding Widgets

To add a widget type:

1. Add or extend the widget schema in `packages/content/src/schemas/widget.ts`.
2. Add the React component under `packages/engine-ui/src/visuals/widgets`.
3. Register the component in `packages/engine-ui/src/helpers/registerWidgetHelper.ts`.
4. Add rendering behavior to the widget registry if the discriminated union requires it.
5. Add sample JSON under the active game's `widgets` directory.
6. Reference the widget from a surface layout.
7. Add tests for schema loading and registry behavior.

## Adding Layouts

To add a layout type:

1. Add or extend the layout schema in `packages/content/src/schemas/layout.ts`.
2. Add the React layout component under `packages/engine-ui/src/visuals/layouts`.
3. Register the component in `packages/engine-ui/src/helpers/registerLayoutHelper.ts`.
4. Add rendering behavior to the layout registry if needed.
5. Add tests for schema loading and registry behavior.

## Current Project Priorities

Near-term work should focus on making the runtime/content loop complete:

1. Make the sample game references internally consistent.
2. Add a minimal playable or interactive `game-surface`.
3. Add cross-resource content validation.
4. Move button action execution behind an injected engine service.
5. Expand the editor after the runtime behavior is stable enough to edit.
