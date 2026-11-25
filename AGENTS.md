# Agents Guide

## Backward compatibility

- During this development phase, breaking changes to APIs, game data, and save formats are acceptable. Skip compatibility shims and migrations unless explicitly requested.
- When a change affects a sample game, update its files in `sample-games/` directly so it stays playable with the current engine.

## Code conventions

- Use single quotes and omit semicolons.
- Adhere to SOLID principles.
- Prefer dependency injection over global singletons.
- Emphasize single responsibility for classes/modules.
- Keep schemas, game-runtime, and utilities independent of browser and Node globals.
- Keep all tests and fixtures under the root `tests/` directory, named `*.test.ts`.
- Use Vite+ APIs from `vite-plus` and test APIs from `vite-plus/test`.

## Development instances

- Reserve ports 5173 (engine), 5174 (editor UI), and 3000 (editor server) for the user's instances.
- Use separate free ports for agent instances, such as 5273, 5274, and 3100.
- For every agent editor server, set `EDITOR_WORK_FOLDER` to the absolute path of this checkout's `.agent-games/` directory. Create it if needed. Point the agent editor UI's `EDITOR_SERVER_URL` at that server.
- Scope temporary environment overrides to agent processes; do not write shared `.env` files.
- Never stop or restart user processes. Clean up only processes started by the agent.

## Validation

Before completing a code task, run `pnpm lint`, `pnpm test`, and `pnpm build`.
Run `pnpm typecheck` when tests or TypeScript configuration change.
