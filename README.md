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

- **What's included:** about 15,000 skills (14,812 upstream skills plus the three originals) from about 930 GitHub repositories. Repositories were found via GitHub search and each has at least 1.2k stars; aggregator/registry repositories and duplicate copies of the same skill were excluded. Every entry points at a real `SKILL.md` in its repository. The three original skills in `skills/` (`review-my-diff`, `write-pr-description`, `draft-release-notes`) are included too.
- **Grouped in 13 categories:** Coding & engineering, UI & design, Video, audio & animation, AI & agents, Data & analytics, Cloud & DevOps, Security, Docs & office, Writing & marketing, Product & business, Research & science, Workflow & productivity, Games & 3D. Filter with the category chips (`?cat=<id>`) or search everything (`?q=`).
- **Rows link to GitHub.** Clicking a skill opens its folder in the source repository in a new tab. The site has no detail pages or install instructions; follow the upstream repository's own docs.
- **Summaries** are the first sentence of each skill's upstream `description` frontmatter.
- **Home page:** "Most popular" (top 12 by stars, at most 2 per repository), then the top 5 of each category (at most 1 per repository) with a "View all" link. Searches and category views are a ranked list, 50 rows per page with "Load more".

Claude Code looks for personal skills in `~/.claude/skills/<skill-name>/SKILL.md` and project skills in `.claude/skills/<skill-name>/SKILL.md`. See https://code.claude.com/docs/en/skills.

## Packs

`data/packs.json` defines 16 curated packs of 20 skills each (Developer, Video editor, Security, and so on). Skill ids are resolved against the catalog at request time, ids that are missing are skipped, and each pack has a page at `/packs/<slug>` whose rows link straight to GitHub.

## Data format and search

The catalog lives in `data/catalog.json` (about 2.8 MB, about 1 MB gzipped). It is read only on the server by `src/lib/catalog.server.ts` and is never shipped to the browser. To stay small it is columnar:

```jsonc
{
  "version": 1,
  "generatedAt": "2026-11-20",
  "starsAsOf": "2026-11-20",
  "categories": ["coding", "design", ...],      // 13 ids
  "repos": [["owner/name", "branch", stars], ...],
  "skills": {
    "r": [repoIndex, ...],   // index into repos
    "n": [name, ...],
    "s": [summary, ...],
    "c": [categoryIndex, ...],
    "p": [folderPath, ...]   // "" means the repository root
  }
}
```

A skill's URL is `https://github.com/<owner/name>/tree/<branch>/<path>` (or the repository URL when the path is empty) and its id is `<owner>/<repo>/<name>` in lowercase.

Search runs on the server (`src/lib/search.ts`, pure and unit-tested) over precomputed, normalized haystacks (name, summary, category, owner, repo and a few aliases). Every query word must match. Results rank exact name, then name prefix, then name contains, then all words in the name, then everything else; ties go to the repository with more stars. The page is server-rendered from `?q=` and `?cat=`, and the browser then calls the JSON API:

`GET /api/skills?q=&cat=&offset=&limit=` returns `{ total, counts, items }`, where `counts` are per-category matches for the query ignoring `cat`. `limit` is capped at 100, and responses are cached at the edge (`s-maxage=3600, stale-while-revalidate=86400`).

## Star counts

Star counts belong to the skill's **repository**, not to the individual skill, so every skill from the same repository shows the same number.

- **Default:** the snapshot stored in `data/catalog.json` (`starsAsOf`), labelled "GitHub stars · as of Nov 20, 2026". No GitHub requests are made.
- **Live refresh (optional):** set `GITHUB_TOKEN` and the server refreshes counts through the GitHub GraphQL API (`POST /graphql`, up to 100 repositories per query using aliases, 8 s timeout), cached for an hour. The label then reads "GitHub stars · updated hourly". If a query fails or a repository is missing, its snapshot value is kept. The token is only sent in the `Authorization` header; it is never logged or sent to the browser. A token with no scopes is enough. `GITHUB_API_BASE` overrides the API host, which is handy for testing against a mock.

## Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Set the production branch to `main`.
3. Preview deployments come from the Git integration for other branches and pull requests.
4. Optionally set the `GITHUB_TOKEN` environment variable for hourly live star counts (a token with no scopes is enough). Without it the site shows the dated snapshot.
