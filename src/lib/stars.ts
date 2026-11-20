// Server-only: import this module from server components only (it reads
// process.env.GITHUB_TOKEN). Never import it from a "use client" file.
import type { RepoRef } from "@/data/catalog";

/** Star counts are cached and refreshed at most once per hour. */
export const STAR_REVALIDATE_SECONDS = 3600;

/** GitHub search caps query length; keep each `q` at or under this. */
export const MAX_QUERY_LENGTH = 250;

const lastKnown = new Map<string, number>();

/** Split keys into `repo:a/b repo:c/d` queries of at most MAX_QUERY_LENGTH chars. */
export function chunkQueries(keys: string[]): string[] {
  const out: string[] = [];
  let cur = "";
  for (const k of keys) {
    const term = `repo:${k}`;
    const next = cur ? `${cur} ${term}` : term;
    if (cur && next.length > MAX_QUERY_LENGTH) {
      out.push(cur);
      cur = term;
    } else {
      cur = next;
    }
  }
  if (cur) out.push(cur);
  return out;
}

async function fetchChunk(q: string): Promise<Map<string, number>> {
  const base = process.env.GITHUB_API_BASE || "https://api.github.com";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "skill-stacks",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const params = new URLSearchParams({ q, per_page: "100" });
  const res = await fetch(`${base}/search/repositories?${params}`, {
    headers,
    next: { revalidate: STAR_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const json: unknown = await res.json();
  const items = (json as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) throw new Error("bad payload");
  const found = new Map<string, number>();
  for (const item of items) {
    const { full_name, stargazers_count } = (item ?? {}) as {
      full_name?: unknown;
      stargazers_count?: unknown;
    };
    if (typeof full_name === "string" && typeof stargazers_count === "number") {
      found.set(full_name.toLowerCase(), stargazers_count);
    }
  }
  return found;
}

/** Keyed by lowercase `owner/name`. Never throws; null means unavailable. */
export async function getStarCounts(
  repos: RepoRef[],
): Promise<Record<string, number | null>> {
  const keys = [...new Set(repos.map((r) => `${r.owner}/${r.name}`.toLowerCase()))];
  const result: Record<string, number | null> = {};
  await Promise.all(
    chunkQueries(keys).map(async (q) => {
      const chunkKeys = q.split(" ").map((t) => t.slice("repo:".length));
      let found: Map<string, number> | null = null;
      try {
        found = await fetchChunk(q);
      } catch {
        found = null;
      }
      for (const k of chunkKeys) {
        const v = found?.get(k);
        if (typeof v === "number") lastKnown.set(k, v);
        result[k] = typeof v === "number" ? v : (lastKnown.get(k) ?? null);
      }
    }),
  );
  return Object.fromEntries(keys.map((k) => [k, result[k] ?? null]));
}
