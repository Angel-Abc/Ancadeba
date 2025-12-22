# Agents Guide

This project prioritizes determinism, clarity, and architectural correctness over speed.

## Code Design Guidelines

- Use single quotes for all strings.
- Omit semicolons at the end of statements.
- Adhere to SOLID principles.
- Prefer dependency injection over global singletons.
- Emphasize single responsibility for classes/modules.

## Testing Guidelines

- Use Arrange/Act/Assert comments in tests; keep each section explicit.

## Required Checks

Before marking any code task as complete, ensure the following commands are run and pass:

- pnpm lint
- pnpm build
