// Pure search over a pre-indexed catalog. No I/O; safe to unit test.
import type { CatalogSkill, CategoryId, SearchResult } from "./categories";
import { CATEGORY_LABELS, emptyCounts } from "./categories";

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

/** Lowercase, strip diacritics, drop every non-alphanumeric run. */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export type IndexedSkill = {
  skill: CatalogSkill;
  /** Normalized skill name. */
  name: string;
  /** Normalized searchable fields joined with "|" (never produced by normalize). */
  hay: string;
};

export function indexSkill(skill: CatalogSkill, aliases: readonly string[] = []): IndexedSkill {
  const name = normalize(skill.name);
  const hay = [
    name,
    skill.summary,
    skill.category,
    CATEGORY_LABELS[skill.category] ?? "",
    skill.repo.owner,
    skill.repo.name,
    ...aliases,
  ]
    .map(normalize)
    .join("|");
  return { skill, name, hay };
}

export type SearchOptions = {
  q?: string;
  cat?: CategoryId | null;
  offset?: number;
  limit?: number;
};

function clampInt(v: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(v)));
}

/** Lower is better: exact name, name prefix, name contains, all tokens in name, other. */
function rankOf(e: IndexedSkill, q: string, tokens: string[]): number {
  if (e.name === q) return 0;
  if (e.name.startsWith(q)) return 1;
  if (e.name.includes(q)) return 2;
  if (tokens.every((t) => e.name.includes(t))) return 3;
  return 4;
}

function byStarsThenName(a: CatalogSkill, b: CatalogSkill): number {
  if (a.stars !== b.stars) return b.stars - a.stars;
  return a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function searchSkills(all: readonly IndexedSkill[], opts: SearchOptions = {}): SearchResult {
  const raw = opts.q ?? "";
  const cat = opts.cat ?? null;
  const offset = clampInt(opts.offset, 0, Number.MAX_SAFE_INTEGER, 0);
  const limit = clampInt(opts.limit, 1, MAX_LIMIT, DEFAULT_LIMIT);
  const counts = emptyCounts();

  const q = normalize(raw);
  if (!q && raw.trim() !== "") return { total: 0, counts, items: [] };
  const tokens = raw.split(/\s+/).map(normalize).filter(Boolean);

  const hits: { skill: CatalogSkill; rank: number }[] = [];
  for (const e of all) {
    if (q) {
      let ok = true;
      for (const t of tokens) {
        if (!e.hay.includes(t)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
    }
    counts[e.skill.category]++;
    if (cat && e.skill.category !== cat) continue;
    hits.push({ skill: e.skill, rank: q ? rankOf(e, q, tokens) : 0 });
  }

  hits.sort((a, b) => a.rank - b.rank || byStarsThenName(a.skill, b.skill));
  return {
    total: hits.length,
    counts,
    items: hits.slice(offset, offset + limit).map((h) => h.skill),
  };
}

/** Top skills by stars, at most `perRepo` from any one repository. */
export function topByStars(
  skills: readonly CatalogSkill[],
  n: number,
  perRepo: number,
): CatalogSkill[] {
  const sorted = [...skills].sort(byStarsThenName);
  const used = new Map<string, number>();
  const out: CatalogSkill[] = [];
  for (const s of sorted) {
    if (out.length >= n) break;
    const key = `${s.repo.owner}/${s.repo.name}`.toLowerCase();
    const k = used.get(key) ?? 0;
    if (k >= perRepo) continue;
    used.set(key, k + 1);
    out.push(s);
  }
  return out;
}
