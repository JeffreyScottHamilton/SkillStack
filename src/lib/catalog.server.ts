// Server-only: reads data/catalog.json from disk. Never import this module (or
// anything that imports it) from a "use client" file; the client bundle must not
// contain the catalog.
import fs from "node:fs";
import path from "node:path";
import type { CatalogSkill, CategoryId, HomeData, RepoRef } from "./categories";
import { CATEGORIES, CATEGORY_IDS, emptyCounts, isCategoryId, repoKey } from "./categories";
import type { IndexedSkill } from "./search";
import { indexSkill, topByStars } from "./search";
import { hasLiveStars, refreshStars } from "./stars";

/** Columnar on-disk format of data/catalog.json. */
export type PackedCatalog = {
  version: 1;
  generatedAt: string;
  starsAsOf: string;
  categories: string[];
  /** [fullName, branch, stars] */
  repos: [string, string, number][];
  skills: { r: number[]; n: string[]; s: string[]; c: number[]; p: string[] };
};

export type Catalog = {
  skills: CatalogSkill[];
  index: IndexedSkill[];
  repos: (RepoRef & { stars: number })[];
  starsAsOf: string;
  live: boolean;
};

/** Extra search terms for specific skills. */
export function aliasesFor(skill: CatalogSkill): string[] {
  if (repoKey(skill.repo) === "juliusbrussee/caveman" && skill.name === "caveman") {
    return ["cave man"];
  }
  if (skill.id === "multica-ai/andrej-karpathy-skills/karpathy-guidelines") {
    return ["kaparthy", "karpathy"];
  }
  return [];
}

export function expandCatalog(packed: PackedCatalog): Catalog {
  const repos = packed.repos.map(([fullName, , stars]) => {
    const [owner, name] = fullName.split("/");
    return { owner, name, stars };
  });
  const { r, n, s, c, p } = packed.skills;
  const skills: CatalogSkill[] = new Array(n.length);
  for (let i = 0; i < n.length; i++) {
    const [fullName, branch, stars] = packed.repos[r[i]];
    const repo = repos[r[i]];
    const cat = packed.categories[c[i]];
    if (!isCategoryId(cat)) throw new Error(`Unknown category ${cat} for ${fullName}/${n[i]}`);
    skills[i] = {
      id: `${fullName}/${n[i]}`.toLowerCase(),
      name: n[i],
      summary: s[i],
      category: cat,
      repo: { owner: repo.owner, name: repo.name },
      stars,
      url: p[i]
        ? `https://github.com/${fullName}/tree/${branch}/${p[i]}`
        : `https://github.com/${fullName}`,
    };
  }
  return {
    skills,
    index: skills.map((sk) => indexSkill(sk, aliasesFor(sk))),
    repos,
    starsAsOf: packed.starsAsOf,
    live: false,
  };
}

let snapshot: Catalog | null = null;

/** The catalog with snapshot star counts. Loaded once per server process. */
export function getCatalog(): Catalog {
  if (!snapshot) {
    const file = path.join(process.cwd(), "data", "catalog.json");
    snapshot = expandCatalog(JSON.parse(fs.readFileSync(file, "utf8")) as PackedCatalog);
  }
  return snapshot;
}

/** Refresh live stars at most hourly; retry sooner after a total failure. */
const LIVE_TTL_MS = 3600_000;
const FAILED_TTL_MS = 300_000;
let liveMemo: { expires: number; promise: Promise<Catalog> } | null = null;

function withStars(base: Catalog, stars: Record<string, number>): Catalog {
  const skills = base.skills.map((s) => {
    const v = stars[repoKey(s.repo)];
    return typeof v === "number" && v !== s.stars ? { ...s, stars: v } : s;
  });
  return {
    skills,
    index: base.index.map((e, i) => (e.skill === skills[i] ? e : { ...e, skill: skills[i] })),
    repos: base.repos.map((r) => ({ ...r, stars: stars[repoKey(r)] ?? r.stars })),
    starsAsOf: base.starsAsOf,
    live: true,
  };
}

/**
 * The catalog with live star counts when GITHUB_TOKEN is set (GitHub GraphQL,
 * refreshed hourly), otherwise the snapshot. If no live data could be fetched the
 * snapshot is returned. Never throws on network errors.
 */
export async function getLiveCatalog(): Promise<Catalog> {
  const base = getCatalog();
  if (!hasLiveStars()) return base;
  const now = Date.now();
  if (liveMemo && liveMemo.expires > now) return liveMemo.promise;
  const previous = liveMemo?.promise;
  const memo = {
    expires: now + LIVE_TTL_MS,
    promise: refreshStars(base.repos).then(async ({ stars, live }) => {
      if (live) return withStars(base, stars);
      memo.expires = Date.now() + FAILED_TTL_MS;
      // Keep the last good live data if there was any.
      const prev = previous ? await previous : base;
      return prev;
    }),
  };
  liveMemo = memo;
  return memo.promise;
}

export function starsLabel(catalog: Catalog): string {
  if (catalog.live) return "GitHub stars · updated hourly";
  const d = new Date(`${catalog.starsAsOf}T00:00:00Z`);
  const when = Number.isNaN(d.getTime())
    ? catalog.starsAsOf
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(d);
  return `GitHub stars · as of ${when}`;
}

/** Home page: top 12 by stars (≤2 per repo), then each category's top 5 (≤1 per repo). */
const homeCache = new WeakMap<Catalog, HomeData>();

export function getHome(catalog: Catalog): HomeData {
  const cached = homeCache.get(catalog);
  if (cached) return cached;
  const byCat = new Map<CategoryId, CatalogSkill[]>(CATEGORY_IDS.map((id) => [id, []]));
  const counts = emptyCounts();
  for (const s of catalog.skills) {
    byCat.get(s.category)!.push(s);
    counts[s.category]++;
  }
  const home: HomeData = {
    popular: topByStars(catalog.skills, 12, 2),
    sections: CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      total: counts[c.id],
      items: topByStars(byCat.get(c.id)!, 5, 1),
    })).filter((sec) => sec.total > 0),
    counts,
  };
  homeCache.set(catalog, home);
  return home;
}
