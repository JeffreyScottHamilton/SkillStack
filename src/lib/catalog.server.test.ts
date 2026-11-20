import { afterEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES, repoKey } from "./categories";
import { getCatalog, getHome, starsLabel } from "./catalog.server";
import { searchSkills } from "./search";

const catalog = getCatalog();
const { skills } = catalog;

describe("catalog", () => {
  it("has 14,812 upstream skills plus the three originals from 929 repos", () => {
    expect(skills.length).toBe(14815);
    expect(catalog.repos.length).toBe(929);
    const own = skills.filter((s) => repoKey(s.repo) === "jeffreyscotthamilton/skillstack");
    expect(own.map((s) => s.name).sort()).toEqual([
      "draft-release-notes",
      "review-my-diff",
      "write-pr-description",
    ]);
    for (const s of own) {
      expect(s.url).toBe(`https://github.com/JeffreyScottHamilton/SkillStack/tree/main/skills/${s.name}`);
      expect(s.category).toBe("coding");
      expect(s.summary.endsWith(".")).toBe(true);
    }
  });

  it("has unique lowercase ids", () => {
    expect(new Set(skills.map((s) => s.id)).size).toBe(skills.length);
    for (const s of skills) expect(s.id).toBe(`${s.repo.owner}/${s.repo.name}/${s.name}`.toLowerCase());
  });

  it("links every row to its repository on GitHub", () => {
    for (const s of skills) {
      const prefix = `https://github.com/${s.repo.owner}/${s.repo.name}`;
      expect(s.url === prefix || s.url.startsWith(`${prefix}/tree/`), s.id).toBe(true);
    }
  });

  it("uses the 13 known categories and numeric stars", () => {
    expect(CATEGORIES).toHaveLength(13);
    const ids = new Set<string>(CATEGORIES.map((c) => c.id));
    for (const s of skills) {
      expect(ids.has(s.category), s.id).toBe(true);
      expect(Number.isFinite(s.stars)).toBe(true);
    }
  });

  it("searches the real catalog with aliases", () => {
    expect(searchSkills(catalog.index, { q: "caveman" }).items[0].id).toBe(
      "juliusbrussee/caveman/caveman",
    );
    expect(searchSkills(catalog.index, { q: "cave man" }).items[0].id).toBe(
      "juliusbrussee/caveman/caveman",
    );
    expect(searchSkills(catalog.index, { q: "kaparthy" }).items.map((s) => s.id)).toContain(
      "multica-ai/andrej-karpathy-skills/karpathy-guidelines",
    );
    expect(
      searchSkills(catalog.index, { q: "notes release" }).items.map((s) => s.id),
    ).toContain("jeffreyscotthamilton/skillstack/draft-release-notes");
  });

  it("labels the snapshot date", () => {
    expect(starsLabel(catalog)).toBe("GitHub stars · as of Nov 20, 2026");
    expect(starsLabel({ ...catalog, live: true })).toBe("GitHub stars · updated hourly");
  });

  it("builds the home page sections", () => {
    const home = getHome(catalog);
    expect(home.popular).toHaveLength(12);
    const perRepo = new Map<string, number>();
    for (const s of home.popular) perRepo.set(repoKey(s.repo), (perRepo.get(repoKey(s.repo)) ?? 0) + 1);
    expect(Math.max(...perRepo.values())).toBeLessThanOrEqual(2);
    expect(home.sections).toHaveLength(13);
    for (const sec of home.sections) {
      expect(sec.items).toHaveLength(5);
      expect(new Set(sec.items.map((s) => repoKey(s.repo))).size).toBe(5);
      expect(sec.items.every((s) => s.category === sec.id)).toBe(true);
    }
    expect(Object.values(home.counts).reduce((a, b) => a + b, 0)).toBe(skills.length);
  });
});

describe("getLiveCatalog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  async function load() {
    vi.resetModules();
    return await import("./catalog.server");
  }

  it("returns the snapshot without a token and makes no request", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const m = await load();
    const c = await m.getLiveCatalog();
    expect(c.live).toBe(false);
    expect(m.starsLabel(c)).toBe("GitHub stars · as of Nov 20, 2026");
    expect(f).not.toHaveBeenCalled();
  });

  it("applies live stars and memoizes the refresh", async () => {
    vi.stubEnv("GITHUB_TOKEN", "tkn");
    vi.stubEnv("GITHUB_API_BASE", "http://mock.invalid");
    const f = vi.fn(async () =>
      new Response(JSON.stringify({ data: { r0: { stargazerCount: 123 } } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", f);
    const m = await load();
    const c = await m.getLiveCatalog();
    expect(c.live).toBe(true);
    expect(m.starsLabel(c)).toBe("GitHub stars · updated hourly");
    const first = m.getCatalog().repos[0];
    const key = `${first.owner}/${first.name}`.toLowerCase();
    expect(c.skills.find((s) => repoKey(s.repo) === key)?.stars).toBe(123);
    expect(c.repos[1].stars).toBe(m.getCatalog().repos[1].stars); // missing -> snapshot
    const calls = f.mock.calls.length;
    expect(calls).toBe(Math.ceil(c.repos.length / 100));
    await m.getLiveCatalog();
    expect(f.mock.calls.length).toBe(calls);
  });

  it("falls back to the snapshot label when GitHub is unreachable", async () => {
    vi.stubEnv("GITHUB_TOKEN", "tkn");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const m = await load();
    const c = await m.getLiveCatalog();
    expect(c.live).toBe(false);
    expect(m.starsLabel(c)).toBe("GitHub stars · as of Nov 20, 2026");
  });
});
