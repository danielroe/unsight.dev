# Contributing to unsight.dev

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to unsight.dev.

> [!IMPORTANT]
> Please be respectful and constructive in all interactions. We aim to maintain a welcoming environment for all contributors.
> [Read our Code of Conduct](./CODE_OF_CONDUCT.md)

## Goals

[unsight.dev](https://unsight.dev/) helps detect duplicate GitHub issues, areas of concern, and more across related repositories. It uses AI-powered embeddings and clustering to surface patterns that are hard to spot manually.

## Table of Contents

- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick start (UI only)](#quick-start-ui-only)
  - [Full development setup](#full-development-setup)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
  - [Available commands](#available-commands)
  - [Environment variables](#environment-variables)
- [Tech stack](#tech-stack)
- [Code style](#code-style)
  - [TypeScript](#typescript)
  - [Vue components](#vue-components)
  - [Server API patterns](#server-api-patterns)
  - [Naming conventions](#naming-conventions)
- [Submitting changes](#submitting-changes)
  - [Before submitting](#before-submitting)
  - [Pull request process](#pull-request-process)
  - [Commit messages and PR titles](#commit-messages-and-pr-titles)
- [Pre-commit hooks](#pre-commit-hooks)
- [Browser extension](#browser-extension)
- [Using AI](#using-ai)
- [Questions](#questions)
- [License](#license)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22+ recommended)
- [pnpm](https://pnpm.io/) v10.32.1 or later (via [corepack](https://nodejs.org/api/corepack.html))

### Quick start (UI only)

If you just want to work on the frontend/UI, you can use the deployed API as a backend:

```bash
corepack enable
pnpm install
pnpm dev --ui-only
```

This starts a local dev server at `http://localhost:3000` using the remote API at `https://unsight.dev` to populate it.

### Full development setup

A full development environment requires a GitHub App and Cloudflare integration. See the [Development environment section in the README](./README.md#-development-environment) for the complete walkthrough, which covers:

1. Starting a local tunnel (ngrok)
2. Creating a GitHub App for development
3. Configuring secrets (`.env` file)
4. Linking your Cloudflare account via NuxtHub

## Project structure

unsight.dev is a **pnpm monorepo** with two packages:

```
unsight.dev/
├── packages/
│   ├── web/                       # Nuxt 4 web application
│   │   ├── app/
│   │   │   ├── components/        # Vue components
│   │   │   ├── composables/       # Vue composables
│   │   │   ├── pages/             # File-based routing
│   │   │   └── app.vue            # Root component
│   │   ├── server/
│   │   │   ├── api/               # API routes (Nitro)
│   │   │   ├── db/                # Drizzle schema + migrations
│   │   │   ├── routes/            # Server routes (webhooks, auth)
│   │   │   ├── tasks/             # Background tasks (indexing, cleanup)
│   │   │   └── utils/             # Server utilities (AI, clustering, etc.)
│   │   ├── modules/               # Custom Nuxt modules
│   │   ├── nuxt.config.ts
│   │   └── uno.config.ts
│   │
│   └── extension/                 # Browser extension (Chrome + Firefox)
│       ├── components/            # Vue components
│       ├── entrypoints/           # WXT content script entry
│       └── wxt.config.ts
│
├── eslint.config.js               # Root ESLint config
├── vite.config.ts                 # vite-plus config (pre-commit hooks)
└── package.json                   # Workspace root
```

> [!TIP]
> For more about the Nuxt directory conventions, check out the [Nuxt directory structure docs](https://nuxt.com/docs/4.x/directory-structure).

## Development workflow

### Available commands

From the repository root:

```bash
# Development
pnpm dev                 # Start web app dev server
pnpm dev --ui-only       # Start with remote API (no GitHub App needed)
pnpm dev:ext             # Start browser extension dev server

# Code quality
pnpm lint                # Run ESLint across the monorepo
pnpm test:types          # TypeScript type checking (all packages)
pnpm test:unit           # Run unit tests (all packages)
```

From `packages/web/`:

```bash
pnpm build               # Production build
pnpm preview             # Preview production build
pnpm db:generate         # Generate Drizzle ORM migrations
```

From `packages/extension/`:

```bash
pnpm dev                 # Dev mode (Chrome)
pnpm dev:firefox         # Dev mode (Firefox)
pnpm build               # Build for Chrome
pnpm build:firefox       # Build for Firefox
pnpm zip                 # Zip for Chrome Web Store
pnpm zip:firefox         # Zip for Firefox Add-ons
```

### Preset repos for development

By default, the dev server auto-indexes `nuxt/module-builder` and `nuxt/cli` so you can see clusters without installing the GitHub App on any repositories.

You can customise this with the `DEV_REPOS_TO_INDEX` environment variable:

```ini
# disable entirely
DEV_REPOS_TO_INDEX=false

# specify custom repos
DEV_REPOS_TO_INDEX=unjs/h3,vuejs/core
```

### Environment variables

See the [README](./README.md#configure-your-secrets) for the full list of required environment variables. The key ones are:

| Variable | Purpose |
|---|---|
| `NUXT_WEBHOOK_GITHUB_SECRET_KEY` | GitHub webhook secret |
| `NUXT_GITHUB_APP_ID` | GitHub App ID |
| `NUXT_GITHUB_PRIVATE_KEY` | GitHub App private key (PKCS#8 format) |
| `NUXT_PUBLIC_GITHUB_APP_SLUG` | Your GitHub App slug |
| `NUXT_OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `NUXT_OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `NUXT_SESSION_PASSWORD` | Session encryption password |
| `NUXT_CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (for local dev AI without Workers bindings) |
| `NUXT_CLOUDFLARE_API_TOKEN` | Cloudflare API token (for local dev AI without Workers bindings) |
| `NUXT_HUB_PROJECT_KEY` | NuxtHub project key (auto-generated) |
| `DEV_REPOS_TO_INDEX` | Preset repos for local dev |

## Tech stack

| Layer | Technology |
|---|---|
| **Framework** | [Nuxt 4](https://nuxt.com/) (Vue 3) |
| **Server engine** | [Nitro](https://nitro.build/) |
| **Styling** | [UnoCSS](https://unocss.dev/) (with Tailwind compat reset) |
| **UI primitives** | [Reka UI](https://reka-ui.com/) |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) via [Drizzle ORM](https://orm.drizzle.team/) |
| **Vector search** | [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) |
| **AI / Embeddings** | [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) |
| **Clustering** | [ml-kmeans](https://github.com/mljs/kmeans) + [ml-distance](https://github.com/mljs/distance) |
| **GitHub integration** | [GitHub App](https://docs.github.com/en/apps) via [@octokit/rest](https://github.com/octokit/rest.js) |
| **Authentication** | GitHub OAuth via [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com/) via [NuxtHub](https://hub.nuxt.com/) |
| **Extension framework** | [WXT](https://wxt.dev/) + Vue 3 |
| **Package manager** | [pnpm](https://pnpm.io/) (monorepo workspaces) |
| **Task runner** | [vite-plus](https://github.com/nicepkg/vite-plus) (`vp`) |
| **Linting** | [ESLint 9](https://eslint.org/) (flat config) with [@antfu/eslint-config](https://github.com/antfu/eslint-config) |
| **Type checking** | [TypeScript](https://www.typescriptlang.org/) + [vue-tsc](https://github.com/vuejs/language-tools) |
| **CI** | [GitHub Actions](https://github.com/features/actions) |

## Code style

Formatting is handled entirely by ESLint's stylistic rules via `@antfu/eslint-config` -- there is no Prettier in this project.

When committing, a pre-commit hook runs ESLint `--fix` on staged files automatically (via vite-plus). If you want to lint everything ahead of time:

```bash
pnpm lint
```

### TypeScript

- Avoid `any` -- use proper types
- Validate inputs rather than just asserting types

### Vue components

- Use Composition API with `<script setup lang="ts">`
- Define props with TypeScript: `defineProps<{ text: string }>()`
- Keep components focused and functions short

```vue
<script setup lang="ts">
defineProps<{
  title: string
  score: number
}>()
</script>
```

### Server API patterns

Server API routes live in `packages/web/server/api/` and follow Nitro conventions:

- File names include the HTTP method: `repos.get.ts`, `dashboards.post.ts`
- Use `defineEventHandler` for route handlers
- Background work is handled via Nitro tasks in `server/tasks/`

### Naming conventions

| Type | Convention | Example |
|---|---|---|
| Vue components | PascalCase | `GitHubIssue.vue` |
| Pages | kebab-case | `index.vue`, `[issue].vue` |
| Composables | camelCase + `use` prefix | `useRepos.ts` |
| Server routes | kebab-case + method | `repos.get.ts` |
| Functions | camelCase | `indexRepo`, `fetchClusters` |
| Constants | SCREAMING_SNAKE_CASE | `DEV_REPOS_TO_INDEX` |
| Types/Interfaces | PascalCase | `Issue`, `Cluster` |

## Submitting changes

### Before submitting

1. Run linting: `pnpm lint`
2. Run type checking: `pnpm test:types`
3. Make sure the dev server starts without errors

### Pull request process

1. Fork the repository and create a branch from `main`
2. Make your changes with clear, descriptive commits
3. Push your branch and open a pull request
4. Ensure CI checks pass (lint, type-check, provenance)
5. Request review from maintainers

### Commit messages and PR titles

We use [Conventional Commits](https://www.conventionalcommits.org/). Since we squash on merge, the PR title becomes the commit message in `main`.

Format: `type(scope): description`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Examples:**

- `fix: resolve clustering accuracy for small repos`
- `feat: add dashboard sharing`
- `docs: update contributing guide`
- `chore(deps): update nuxt to v4.1`

> [!NOTE]
> Use lowercase in your PR title. Individual commits within the PR don't need to follow this format since they'll be squashed.

## Pre-commit hooks

The project uses [vite-plus](https://github.com/nicepkg/vite-plus) to manage pre-commit hooks. On every commit, ESLint `--fix` runs automatically on staged files matching `*.{js,ts,tsx,vue,mjs,cjs,json,.*rc}`.

You don't need to configure anything -- this is set up in `vite.config.ts` at the repo root.

## Browser extension

The browser extension is in `packages/extension/`. It's a [WXT](https://wxt.dev/) content script that injects a "Similar Issues" panel into GitHub issue pages.

- **Content script** injects into `github.com` issue pages
- Fetches similar issues from the unsight.dev API
- Built separately from the web app

To work on the extension:

```bash
pnpm dev:ext         # Start extension dev (Chrome)
```

Extension releases are automated: bump the version with `bumpp` in `packages/extension/`, merge to `main`, and CI handles Chrome Web Store and Firefox Add-ons submission.

## Using AI

You're welcome to use AI tools to help you contribute, with two ground rules:

1. **Never let an LLM speak for you.** When writing comments, issues, or PR descriptions, use your own words. Clarity beats polish.
2. **Never let an LLM think for you.** If AI writes code for you, understand it before contributing it. Take personal responsibility for your contributions.

For more context, see [Using AI in open source](https://roe.dev/blog/using-ai-in-open-source).

## Questions?

If you have questions or need help, feel free to [open an issue](https://github.com/danielroe/unsight.dev/issues) for discussion.

## License

By contributing to unsight.dev, you agree that your contributions will be licensed under the [MIT License](./LICENCE).
