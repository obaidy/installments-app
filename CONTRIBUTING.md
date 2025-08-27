Contributing

- Prerequisites: Node 18 (`nvm use`), npm, and Expo tooling.
- Install: `npm install`
- Environment: copy `.env.example` to `.env` and fill values (see `docs/ENV.md`).

Development

- Run app: `npx expo start`
- Run API: `npm run start-server`
- Lint: `npm run lint`
- Tests: `npm test`

Coding Guidelines

- Keep changes focused and incremental; update docs when behavior changes.
- Follow the existing TypeScript and project structure conventions.
- Prefer small, composable components and hooks.

CI

- GitHub Actions runs install, lint, typecheck, and tests on PRs targeting `main`.
