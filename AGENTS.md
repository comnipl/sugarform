# AGENT Instructions

To keep CI green, always run the same checks as GitHub Actions before committing.
Execute these commands from the repository root:

- `pnpm run format:check`
- `pnpm run lint`
- `pnpm run build`
- `pnpm vitest run --coverage`

If any command cannot run because of missing dependencies or environment limits,
still show the attempt and mention the failure in your PR message.

## Additional rules

- When disabling ESLint via comments, explain the legitimate reason on the line
  immediately before the disabling comment.
- When escaping the TypeScript type system (e.g. using `!` or `as unknown as`),
  explain why it is safe on the line immediately above the code in question.

## Repository philosophy

Sugarform is an uncontrolled form framework for React. Each field is handled by a
`Sugar` instance that becomes _ready_ only after its component registers DOM
getters and setters. Calls to `get()` or `set()` before readiness remain pending
until `ready()` resolves them. This keeps the form state in the DOM while still
allowing external code to interact with fields asynchronously.

`Sugar` dispatches events such as `change` and `blur`. Consumers add event
listeners to these objects instead of directly touching DOM elements. When a
component unmounts, its `Sugar` is destroyed so that pending promises resolve
with `{ result: 'unavailable' }`.

Tests run in both strict and non-strict React modes via
`describeWithStrict`. New code should maintain this asynchronous, event-driven
design.
