# Skill Stacks

A small, curated catalog of skills for Claude Code: search, read what each one does, and copy the install command. Built with Next.js (App Router), TypeScript and Tailwind CSS.

## Local setup

```bash
npm install
npm run dev     # http://localhost:3000
```

Node 22 is expected. Optionally copy `.env.example` to `.env.local` (see "Star counts").

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (`vitest run`) |

## Adding a skill

1. Add an entry to `SKILLS` in `src/data/catalog.ts` (follow the `Skill` type there).
2. **Original skill:** add `skills/<slug>/SKILL.md` with YAML frontmatter (`name`, `description`, `argument-hint`) and a Markdown body. It is rendered on the detail page and offered as a download.
3. **Upstream skill:** verify the `SKILL.md` path in the source repo, write an original one-sentence summary and "when to use" bullets, link to the source, and do not copy upstream content unless its license allows it (then include attribution). Only list install methods you have verified in the upstream docs.

Claude Code looks for personal skills in `~/.claude/skills/<skill-name>/SKILL.md` and project skills in `.claude/skills/<skill-name>/SKILL.md`, and you invoke one with `/skill-name`. Plugin skills use `/plugin-name:skill-name`. See https://code.claude.com/docs/en/skills.

## Star counts

Star counts are the GitHub star count of the skill's repository, not a rating of the skill. They are fetched server-side from the GitHub REST API, deduplicated per repo, and revalidated every 3600 seconds. An optional `GITHUB_TOKEN` (server-only, never sent to the browser or logged) raises the rate limit. On failure (non-2xx, timeout, bad JSON) the last known value is shown, or an em dash (—) if there is none. Counts are never fabricated. `GITHUB_API_BASE` can override the API host, which is handy for testing the failure path.

## Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Set the production branch to `main`.
3. Preview deployments come from the Git integration for other branches and pull requests.
4. Optionally set the `GITHUB_TOKEN` environment variable.

## Upstream sources

| Skill | Repository | Path |
| --- | --- | --- |
| Caveman | `JuliusBrussee/caveman` | `skills/caveman` |
| Karpathy Guidelines | `multica-ai/andrej-karpathy-skills` (formerly `forrestchang/andrej-karpathy-skills`) | `skills/karpathy-guidelines` |
