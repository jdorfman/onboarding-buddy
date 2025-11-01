# Agent Configuration - Onboarding Buddy

## Commands

- **Dev**: `npm run dev` (runs both client and server concurrently)
- **Build**: `npm run build` (builds server and client)
- **Typecheck**: `npm run typecheck` (runs TypeScript checks on both projects)
- **Install**: `npm run install:all` (installs all dependencies)

## Architecture

**Monorepo structure** with three subprojects:

- `client/`: React + Vite frontend (port 3000) with Bootstrap UI
- `server/`: Node.js + Express API (port 3001) with SQLite database
- `shared/`: Shared TypeScript types

**Key technologies**: TypeScript (strict mode), React 18, Vite, Bootstrap 5, better-sqlite3, Amp SDK

## Code Style

- **TypeScript**: Strict mode enabled, ES2022 target, React JSX transform (`react-jsx`)
- **Client module**: ESNext with bundler resolution
- **Server module**: CommonJS with `src/` → `dist/` compilation
- **Imports**: Use path aliases `@/*` in client for src imports
- **Components**: Functional components with TypeScript React.FC pattern
- **Styling**: Bootstrap utility classes (no inline styles), custom CSS in `client/src/styles/`
- **Error handling**: Try/catch with console.error, user-friendly error messages
- **API**: Axios with `/api` base URL, proper error handling in services
- **Emojis**: Never use emojis in code, markdown, or comments
- **Markdown**: All markdown must pass `markdownlint` validation
