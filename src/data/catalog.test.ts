import { describe, expect, it } from "vitest";
import { ALIASES, CATEGORIES, SKILLS, repoKey } from "./catalog";

describe("catalog", () => {
  it("has the full catalog including the three original skills", () => {
    expect(SKILLS.length).toBe(1834);
    const own = SKILLS.filter((s) => repoKey(s.repo) === "jeffreyscotthamilton/skillstack");
    expect(own.map((s) => s.name).sort()).toEqual([
      "draft-release-notes",
      "review-my-diff",
      "write-pr-description",
    ]);
  });

  it("has unique ids", () => {
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length);
  });

  it("links every row to its repository on GitHub", () => {
    for (const s of SKILLS) {
      const prefix = `https://github.com/${s.repo.owner}/${s.repo.name}`;
      expect(s.url === prefix || s.url.startsWith(`${prefix}/`), s.id).toBe(true);
    }
  });

  it("only uses known categories", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(CATEGORIES).toHaveLength(12);
    for (const s of SKILLS) expect(ids.has(s.category), s.id).toBe(true);
  });

  it("keys aliases by existing ids", () => {
    const ids = new Set(SKILLS.map((s) => s.id));
    for (const id of Object.keys(ALIASES)) expect(ids.has(id), id).toBe(true);
  });
});
