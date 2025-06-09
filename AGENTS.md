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

- Write commit titles using the Conventional Commits format
  `<type>(<scope>): <message>`. Use the current package name as the scope,
  for example `feat(core): add new feature`.

- When disabling ESLint via comments, explain the legitimate reason on the line
  immediately before the disabling comment.
- When escaping the TypeScript type system (e.g. using `!` or `as unknown as`),
  explain why it is safe on the line immediately above the code in question.

- Include `- close #15` in PR descriptions implementing issue 15.
