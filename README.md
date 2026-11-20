# Skill Stacks

A searchable catalog of popular skills for Claude Code. Each row links straight to the skill's source on GitHub. Built with Next.js (App Router), TypeScript and Tailwind CSS.

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

## The catalog

- **What's included:** 1,800+ skills from about 65 popular GitHub repositories, plus the three original skills in `skills/` (`review-my-diff`, `write-pr-description`, `draft-release-notes`). Every entry points at a real `SKILL.md` in its repository.
- **Grouped in 12 categories:** Coding & engineering, UI & design, Video, audio & animation, AI & ML, Cloud & DevOps, Security, Docs & office, Writing, marketing & SEO, Product & business, Research & science, Workflow & productivity, Games & 3D. Filter with the category chips (`?cat=<id>`) or search everything (`?q=`).
- **Rows link to GitHub.** Clicking a skill opens its folder in the source repository in a new tab. The site has no detail pages or install instructions; follow the upstream repository's own docs.
- **Summaries** are the first sentence of each skill's upstream `description` frontmatter.
- **Data** lives in `src/data/skills.json` (fields: `id`, `name`, `summary`, `category`, `repo`, `url`); categories, search aliases and types are in `src/data/catalog.ts`.

Claude Code looks for personal skills in `~/.claude/skills/<skill-name>/SKILL.md` and project skills in `.claude/skills/<skill-name>/SKILL.md`. See https://code.claude.com/docs/en/skills.

## Star counts

Star counts are the GitHub star count of the skill's **repository**, not of the individual skill, so every skill from the same repository shows the same number. They are fetched server-side in batches from the GitHub search API (`/search/repositories?q=repo:a/b+repo:c/d…`, each query at most 250 characters), so a full refresh takes only a few requests. Results are revalidated every 3600 seconds. If a batch fails or a repository is missing from the results, the last known value is shown, or an em dash (—) if there is none. Counts are never fabricated. A `GITHUB_TOKEN` (server-only, never sent to the browser or logged) raises the rate limit and is recommended on Vercel. `GITHUB_API_BASE` can override the API host, which is handy for testing the failure path.

## Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Set the production branch to `main`.
3. Preview deployments come from the Git integration for other branches and pull requests.
4. Set the `GITHUB_TOKEN` environment variable (recommended; a token with no scopes is enough for public star counts).
