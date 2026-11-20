// Server-only: reads process.env.GITHUB_TOKEN. Never import from a "use client" file.
import type { RepoRef } from "./categories";
import { repoKey } from "./categories";

/** Live star counts are cached by the fetch cache for an hour. */
export const STAR_REVALIDATE_SECONDS = 3600;
/** Repositories per GraphQL query (one alias each). */
export const GRAPHQL_BATCH = 100;
const TIMEOUT_MS = 8000;

export type RepoStars = RepoRef & { stars: number };

/** True when a GITHUB_TOKEN is configured, i.e. stars are refreshed hourly. */
export function hasLiveStars(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

export function buildStarsQuery(repos: readonly RepoRef[]): string {
  const fields = repos.map(
    (r, i) =>
      `r${i}: repository(owner: ${JSON.stringify(r.owner)}, name: ${JSON.stringify(r.name)}) { stargazerCount }`,
  );
  return `query {\n${fields.join("\n")}\n}`;
}

async function fetchChunk(repos: readonly RepoRef[], token: string): Promise<(number | null)[]> {
  const base = process.env.GITHUB_API_BASE || "https://api.github.com";
  const res = await fetch(`${base}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "skill-stacks",
    },
    body: JSON.stringify({ query: buildStarsQuery(repos) }),
    next: { revalidate: STAR_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  } as RequestInit);
  if (!res.ok) throw new Error(`status ${res.status}`);
  const json = (await res.json()) as { data?: Record<string, unknown> | null } | null;
  const data = json?.data ?? {};
  return repos.map((_, i) => {
    const v = (data[`r${i}`] as { stargazerCount?: unknown } | null | undefined)?.stargazerCount;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  });
}

/**
 * Star counts keyed by lowercase `owner/name`. Without GITHUB_TOKEN this is the
 * snapshot and no request is made. With a token, counts come from GitHub GraphQL;
 * any repository whose chunk fails or that is missing keeps its snapshot value.
 * `live` is true when at least one chunk was answered. Never throws.
 */
export async function refreshStars(
  repos: readonly RepoStars[],
): Promise<{ stars: Record<string, number>; live: boolean }> {
  const out: Record<string, number> = {};
  for (const r of repos) out[repoKey(r)] = r.stars;
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { stars: out, live: false };
  let live = false;

  const chunks: RepoStars[][] = [];
  for (let i = 0; i < repos.length; i += GRAPHQL_BATCH) {
    chunks.push(repos.slice(i, i + GRAPHQL_BATCH));
  }
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const values = await fetchChunk(chunk, token);
        live = true;
        chunk.forEach((r, i) => {
          const v = values[i];
          if (v !== null) out[repoKey(r)] = v;
        });
      } catch {
        // Keep snapshot values for this chunk.
      }
    }),
  );
  return { stars: out, live };
}
