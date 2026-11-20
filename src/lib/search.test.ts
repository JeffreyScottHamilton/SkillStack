import { describe, expect, it } from "vitest";
import type { CatalogSkill, CategoryId } from "./categories";
import { CATEGORY_IDS } from "./categories";
import { MAX_LIMIT, indexSkill, normalize, searchSkills } from "./search";

function skill(
  name: string,
  over: Partial<Omit<CatalogSkill, "repo">> & { owner?: string; repoName?: string } = {},
): CatalogSkill {
  const owner = over.owner ?? "acme";
  const repoName = over.repoName ?? "tools";
  return {
    id: `${owner}/${repoName}/${name}`.toLowerCase(),
    name,
    summary: over.summary ?? "Does a thing.",
    category: over.category ?? "coding",
    repo: { owner, name: repoName },
    stars: over.stars ?? 0,
    url: `https://github.com/${owner}/${repoName}`,
  };
}

const FIXTURE = [
  skill("caveman", { owner: "JuliusBrussee", repoName: "caveman", stars: 100 }),
  skill("caveman-commit", { owner: "JuliusBrussee", repoName: "caveman", stars: 100 }),
  skill("karpathy-guidelines", {
    owner: "multica-ai",
    repoName: "andrej-karpathy-skills",
    stars: 50,
  }),
  skill("draft-release-notes", { summary: "Summarize changes into release notes.", stars: 1 }),
  skill("react-best-practices", { category: "design", stars: 900 }),
  skill("use-react", { category: "coding", stars: 10 }),
  skill("reactor", { category: "coding", stars: 5 }),
  skill("hooks", { summary: "Patterns for React hooks.", stars: 2000 }),
  skill("level-design", { category: "games", summary: "Plan levels.", stars: 3 }),
];
const INDEX = FIXTURE.map((s) =>
  indexSkill(
    s,
    s.name === "caveman" ? ["cave man"] : s.name === "karpathy-guidelines" ? ["kaparthy", "karpathy"] : [],
  ),
);

const names = (q: string, cat: CategoryId | null = null) =>
  searchSkills(INDEX, { q, cat, limit: 100 }).items.map((s) => s.name);

describe("normalize", () => {
  it("collapses case, spaces and punctuation", () => {
    expect(normalize("Cave-Man")).toBe("caveman");
    expect(normalize("cave man")).toBe("caveman");
    expect(normalize("Café")).toBe("cafe");
  });
});

describe("searchSkills", () => {
  it.each(["caveman", "cave man", "CAVE-MAN"])("finds caveman first for %s", (q) => {
    expect(names(q)[0]).toBe("caveman");
  });
  it.each(["Karpathy", "Kaparthy"])("finds karpathy-guidelines for %s", (q) => {
    expect(names(q)).toContain("karpathy-guidelines");
  });
  it("requires every token to match, in any order", () => {
    expect(names("notes release")).toEqual(["draft-release-notes"]);
    expect(names("notes zzz")).toEqual([]);
  });
  it("matches repo owner and name", () => {
    expect(names("andrej-karpathy-skills")).toEqual(["karpathy-guidelines"]);
    expect(names("multica")).toEqual(["karpathy-guidelines"]);
  });
  it("matches category id and label", () => {
    expect(names("Games & 3D")).toEqual(["level-design"]);
    expect(names("games")).toEqual(["level-design"]);
  });
  it("ranks exact > prefix > contains > summary, then stars", () => {
    const idx = [
      ...INDEX,
      indexSkill(skill("react", { stars: 1 })),
    ];
    const r = searchSkills(idx, { q: "react" }).items.map((s) => s.name);
    expect(r).toEqual([
      "react", // exact
      "react-best-practices", // prefix, 900 stars
      "reactor", // prefix, 5 stars
      "use-react", // contains
      "hooks", // summary only
    ]);
  });
  it("ranks all-tokens-in-name above other matches", () => {
    const idx = [
      indexSkill(skill("notes-for-release", { stars: 1 })),
      indexSkill(skill("changelog", { summary: "release notes", stars: 99 })),
    ];
    expect(searchSkills(idx, { q: "release notes" }).items.map((s) => s.name)).toEqual([
      "notes-for-release",
      "changelog",
    ]);
  });
  it("breaks star ties by name", () => {
    const idx = [indexSkill(skill("b-x")), indexSkill(skill("a-x"))];
    expect(searchSkills(idx, { q: "" }).items.map((s) => s.name)).toEqual(["a-x", "b-x"]);
  });
  it("returns everything ranked by stars for an empty or blank query", () => {
    for (const q of ["", "   "]) {
      const r = searchSkills(INDEX, { q, limit: 100 });
      expect(r.total).toBe(FIXTURE.length);
      expect(r.items[0].name).toBe("hooks");
      expect(r.items.map((s) => s.stars)).toEqual(
        [...r.items.map((s) => s.stars)].sort((a, b) => b - a),
      );
    }
  });
  it("returns nothing for a punctuation-only query", () => {
    const r = searchSkills(INDEX, { q: "!!!" });
    expect(r.total).toBe(0);
    expect(r.items).toEqual([]);
    expect(Object.values(r.counts).every((n) => n === 0)).toBe(true);
  });
  it("filters by category but counts ignore the category", () => {
    const r = searchSkills(INDEX, { q: "react", cat: "design" });
    expect(r.items.map((s) => s.name)).toEqual(["react-best-practices"]);
    expect(r.total).toBe(1);
    expect(r.counts.design).toBe(1);
    expect(r.counts.coding).toBe(3);
    expect(Object.keys(r.counts).sort()).toEqual([...CATEGORY_IDS].sort());
  });
  it("paginates with offset and limit, capped at MAX_LIMIT", () => {
    const all = searchSkills(INDEX, { q: "", limit: 100 }).items.map((s) => s.id);
    const page = searchSkills(INDEX, { q: "", offset: 2, limit: 3 });
    expect(page.total).toBe(FIXTURE.length);
    expect(page.items.map((s) => s.id)).toEqual(all.slice(2, 5));
    const big = Array.from({ length: 250 }, (_, i) => indexSkill(skill(`s${i}`)));
    expect(searchSkills(big, { q: "", limit: 1000 }).items).toHaveLength(MAX_LIMIT);
    expect(searchSkills(big, { q: "", offset: -5, limit: 0 }).items.length).toBeGreaterThan(0);
  });
  it("searches 15,000 entries in under 50 ms", () => {
    const words = ["react", "python", "docs", "video", "agent", "cloud", "test", "design"];
    const cats = CATEGORY_IDS;
    const big = Array.from({ length: 15000 }, (_, i) =>
      indexSkill(
        skill(`${words[i % 8]}-${words[(i * 7) % 8]}-${i}`, {
          owner: `owner${i % 900}`,
          repoName: `repo-${i % 900}`,
          summary: `Helps with ${words[(i * 3) % 8]} and ${words[(i * 5) % 8]} work number ${i}.`,
          category: cats[i % cats.length],
          stars: (i * 7919) % 100000,
        }),
      ),
    );
    searchSkills(big, { q: "warm up" });
    for (const q of ["react", "python docs", "", "zzz"]) {
      const t = performance.now();
      const r = searchSkills(big, { q, limit: 50 });
      const ms = performance.now() - t;
      expect(ms, q).toBeLessThan(50);
      expect(r.items.length).toBeLessThanOrEqual(50);
    }
  });
});
