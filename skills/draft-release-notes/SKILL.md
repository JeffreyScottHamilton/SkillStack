---
name: draft-release-notes
description: Summarize changes since the last tag into user-facing release notes grouped as Added, Changed, Fixed, Removed, Security. Use when asked to "draft release notes", "write a changelog", or "what changed since the last release".
argument-hint: "[previous-tag]"
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git describe:*), Bash(git tag:*), Bash(git status:*), Bash(git rev-parse:*), Read, Grep, Glob
---

# Draft release notes

Write release notes for people who use the software, not people who build it. Never create tags, commit, or push.

## 1. Find the range

- If `$ARGUMENTS` is non-empty, use it as the previous tag.
- Otherwise run `git describe --tags --abbrev=0`. If there are no tags, use the root with `git log --oneline` and tell the user.
- Verify the tag exists with `git tag --list <tag>`.

The range is `<tag>..HEAD`.

## 2. Collect changes

1. `git log <tag>..HEAD --no-merges --format='%h %s%n%b---'` for subjects and bodies.
2. `git diff <tag>..HEAD --stat` to gauge scope.
3. Inspect diffs (or Read the code) for any commit whose subject is vague, and for anything that might change public behavior: APIs, CLI flags, config keys, file formats, defaults, dependencies.

## 3. Classify

Place each change in one section: **Added**, **Changed**, **Fixed**, **Removed**, **Security**. Omit empty sections.

- Skip chores, CI-only, formatting, test-only, and internal refactors with no visible effect.
- Merge related commits into one entry.
- Write in user-facing language: what is now possible or different, not which function changed. Start with a verb or noun phrase, one line each.
- If a commit subject contains a PR number such as `(#123)`, keep it as `(#123)` at the end of the entry.

## 4. Breaking changes

If anything breaks existing usage (removed or renamed options, changed defaults, dropped versions), put a **Breaking changes** section first. For each, say what changed and give migration steps (old usage -> new usage). If none, omit the section; do not say "none" unless confident.

## 5. Output

A single Markdown document: a `## <next version or "Unreleased"> - <date>` heading, then the sections. Suggest a version bump (major/minor/patch) in one closing line, noting it is a suggestion. Flag any ambiguous commits you could not classify.

## Example

`/draft-release-notes v1.2.0`

```markdown
## Unreleased

### Breaking changes
- The `--out` flag is now `--output`. Replace `tool build --out dist` with `tool build --output dist`. (#88)

### Added
- Export reports as CSV from the Reports page (#91)

### Changed
- Search results now load up to 3x faster (#85)

### Fixed
- Dates no longer shift by one day in UTC-negative time zones (#90)

### Security
- Upgraded the XML parser to address a known vulnerability

Suggested bump: minor to major (breaking flag rename).
```
