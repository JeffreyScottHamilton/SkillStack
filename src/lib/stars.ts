// Server-only: import this module from server components only (it reads
// process.env.GITHUB_TOKEN). Never import it from a "use client" file.
import type { RepoRef } from "@/data/catalog";

/** Star counts are cached and refreshed at most once per hour. */
export const STAR_REVALIDATE_SECONDS = 3600;

const lastKnown = new Map<string, number>();

async function fetchStars(key: string): Promise<number | null> {
  try {
    const base = process.env.GITHUB_API_BASE || "https://api.github.com";
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "skill-stacks",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(`${base}/repos/${key}`, {
      headers,
      next: { revalidate: STAR_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json: unknown = await res.json();
    const count = (json as { stargazers_count?: unknown } | null)?.stargazers_count;
    if (typeof count !== "number") throw new Error("bad payload");
    lastKnown.set(key, count);
    return count;
  } catch {
    return lastKnown.get(key) ?? null;
  }
}

/** Keyed by lowercase `owner/name`. Never throws; null means unavailable. */
export async function getStarCounts(
  repos: RepoRef[],
): Promise<Record<string, number | null>> {
  const keys = [...new Set(repos.map((r) => `${r.owner}/${r.name}`.toLowerCase()))];
  const entries = await Promise.all(
    keys.map(async (k) => [k, await fetchStars(k)] as const),
  );
  return Object.fromEntries(entries);
}
