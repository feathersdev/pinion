# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

Pinion is a fast and typesafe code generator (task runner/scaffolding tool) written in TypeScript. It is an npm (lerna) monorepo with the following packages:

- `packages/pinion` — publishes as `@featherscloud/pinion` (source in `src/`, tests in `test/`, compiled output in `lib/`)
- `packages/pinion-ssg` — publishes as `@featherscloud/pinion-ssg`, a static site generator built on Pinion (see `specs/ssg.md`)

Key characteristics:

- Pure ESM (`"type": "module"`) with `NodeNext` module resolution
- Node >= 22.18
- TypeScript, strict mode, target ES2023
- Tests via vitest, linting via oxlint

## Commands

Run from the repository root:

| Command | Description |
| --- | --- |
| `npm run test` | Full test suite: lint + compile all workspaces + vitest with coverage |
| `npm run vitest` | Run vitest tests with coverage |
| `npm run dev` | Run vitest in watch mode with coverage |
| `npm run lint` | Lint (and auto-fix) with oxlint |
| `npm run compile --workspaces` | Compile all packages (`tsc` output goes to `lib/`) |

Single test file: `npx vitest run packages/pinion/test/utils.test.ts`

## Conventions

- Keep code style consistent with existing sources; comments are sparse — only add when necessary
- Tests live in `packages/pinion/test/` and use fixtures/templates in `test/fixtures` and `test/templates`
- Do not commit changes to `lib/` (compiled output) or `coverage/`
- Follow conventional commit style (e.g. `feat:`, `fix:`, `chore:`) — the changelog is managed via lerna
- Feature/repo specs live in `specs/` (one markdown file each) — consult relevant specs before implementing a feature and keep them up to date when behaviour changes
