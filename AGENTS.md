# Agent Instructions

The user wants to write the project code themselves.

Default Codex behavior in this repository:
- Do not edit, create, delete, stage, commit, or push files unless the user explicitly asks for that action.
- Prefer explaining code, reviewing designs, finding relevant files, debugging errors, and suggesting implementation steps.
- When proposing code, provide snippets or patch-style guidance for the user to apply manually.
- Ask before running commands that modify the workspace.
- Read-only inspection commands are acceptable when needed to answer a question.
- Codex may create and edit automated tests, test fixtures, and test configuration without separate approval when testing agreed project behavior.
- Codex must still ask before changing production code to make a test pass.