---
name: write-pr-description
description: Turn the current branch into a clear pull request description with a suggested title. Follows the repo's PR template if one exists. Use when asked to "write a PR description", "draft the PR body", or "summarize this branch for a pull request".
argument-hint: "[base-branch]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git merge-base:*), Bash(git rev-parse:*), Read, Grep, Glob
---

# Write a PR description

Produce a description a reviewer can read in under a minute. Do not edit files, commit, or push.

## 1. Pick the base

- If `$ARGUMENTS` is non-empty, use it as the base branch.
- Otherwise run `git rev-parse --abbrev-ref origin/HEAD` (strip `origin/`). If that fails, use `main`.

## 2. Read the change

1. `git log <base>..HEAD --format='%h %s%n%b'` for commit messages and intent.
2. `git diff <base>...HEAD --stat`, then `git diff <base>...HEAD` for the details.
3. `git status --short`: if there are uncommitted changes, mention that they are not part of the description.

Read related code with Read/Grep when the diff alone does not explain why a change was made. Mention linked issues only if they appear in commits or branch name.

## 3. Choose the structure

Look for a template: `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, or files in `.github/PULL_REQUEST_TEMPLATE/` (also check `docs/` and the repo root).

- If one exists, keep its headings, order, and checkboxes, and fill each in. Leave a section as "N/A" rather than deleting it.
- Otherwise use: **Summary** (the why, 1-3 sentences), **Changes** (bullets by area), **How to test** (concrete steps or commands), **Risks** (breaking changes, migrations, rollout concerns, or "Low risk" with a reason).

## 4. Rules

- Explain why, not only what; the diff already shows what.
- Never invent test results. For testing, list steps the reviewer can run. Only claim a test passed if you saw evidence of it in this session; otherwise leave the box unchecked or write "Not run".
- Do not mention files or behavior absent from the diff.
- Keep it plain: no filler, no marketing language.

## 5. Output

1. `Suggested title:` a line of at most 72 characters, imperative mood, no trailing period.
2. One fenced Markdown block containing the full description, ready to paste.

## Example

`/write-pr-description main`

````
Suggested title: Add rate limiting to the login endpoint

```markdown
## Summary
Repeated failed logins were unbounded, enabling credential stuffing. This limits attempts per IP.

## Changes
- Add `rateLimit` middleware (5 attempts / 15 min) in `src/middleware/`
- Apply it to `POST /login`
- Document the new 429 response in `docs/api.md`

## How to test
1. `npm test -- rate-limit`
2. Send 6 bad logins to `/login`; the 6th should return 429.

## Risks
Shared office IPs may hit the limit sooner. Window is configurable via `LOGIN_RATE_WINDOW`.
```
````
