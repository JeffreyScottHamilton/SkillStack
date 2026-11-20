---
name: review-my-diff
description: Check a patch before opening a pull request. Reviews the branch diff and uncommitted changes for bugs, missing tests, leftover debug code or secrets, unrelated changes, and doc drift. Use when asked to "review my diff", "check my changes", or "pre-PR review".
argument-hint: "[base-branch]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git merge-base:*), Bash(git rev-parse:*), Read, Grep, Glob
---

# Review my diff

Act as a careful reviewer looking at this patch before it goes up as a pull request. Do not edit any file unless the user explicitly asks you to.

## 1. Pick the base

- If `$ARGUMENTS` is non-empty, use it as the base branch.
- Otherwise run `git rev-parse --abbrev-ref origin/HEAD` (strip the `origin/` prefix). If that fails, use `main`, then `master`.

## 2. Gather the change

1. `git status --short` to see staged, unstaged, and untracked files.
2. `git diff <base>...HEAD` for committed work on the branch.
3. `git diff HEAD` for uncommitted work. Read untracked files directly.
4. `git log <base>..HEAD --oneline` to understand intent.

If the diff is empty, say so and stop. If it is very large, review file by file and state which files you skimmed.

Read surrounding code with Read/Grep when a hunk cannot be judged in isolation (callers, tests, type definitions).

## 3. Review checklist

- **Correctness**: off-by-one, null/undefined paths, wrong conditions, unhandled errors, race conditions, changed behavior of public functions without updating callers.
- **Tests**: new or changed logic with no test; tests that assert nothing; edge cases not covered.
- **Leftovers**: `console.log`/`print`/`debugger`, commented-out code, TODOs added by this patch, focused tests (`.only`, `fdescribe`), hard-coded paths.
- **Secrets**: tokens, keys, passwords, private URLs, committed `.env` files.
- **Unrelated changes**: formatting churn, drive-by refactors, or files that do not belong to this patch's purpose.
- **Naming and docs**: misleading names, README/comments/docs/changelog that no longer match the code.

Only report problems you can point to in the diff. Do not invent issues to fill space.

## 4. Output

Group findings under three headings, omitting none (write "None" if empty):

- **Blocking**: must be fixed before opening the PR.
- **Should fix**: real issues, but not merge-stoppers.
- **Nits**: style and minor polish.

Each finding is one bullet: `path/to/file.ext:LINE` - what is wrong, why it matters, and a concrete fix (a snippet if short).

End with a one-line verdict. If nothing is blocking, say plainly: "Nothing blocks this PR."

## Example

`/review-my-diff main`

```
## Blocking
- src/api/users.ts:42 - `user.email.toLowerCase()` throws when email is null (new OAuth users). Guard with `user.email?.toLowerCase() ?? ""`.

## Should fix
- src/api/users.ts:40-58 - New branch has no test. Add a case in tests/users.test.ts for a null email.

## Nits
- src/api/users.ts:12 - `tmp` is unclear; rename to `normalizedEmail`.

Verdict: 1 blocking issue; fix before opening the PR.
```
