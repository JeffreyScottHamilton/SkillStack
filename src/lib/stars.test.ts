import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Init = RequestInit & { next?: { revalidate?: number } };

async function load() {
  vi.resetModules();
  return await import("./stars");
}

const call = (f: ReturnType<typeof vi.fn>, i: number) =>
  f.mock.calls[i] as unknown as [string, Init];
const bodyOf = (init: Init) => JSON.parse(String(init.body)) as { query: string };

/** Answers every alias in the query with `stars(owner/name)`. */
function graphqlMock(stars: (key: string) => number | null = () => 7) {
  return vi.fn(async (_url: string, init: Init) => {
    const { query } = bodyOf(init);
    const data: Record<string, unknown> = {};
    for (const m of query.matchAll(/(r\d+): repository\(owner: ?("[^"]*"), ?name: ?("[^"]*")\)/g)) {
      const key = `${JSON.parse(m[2])}/${JSON.parse(m[3])}`.toLowerCase();
      const v = stars(key);
      data[m[1]] = v === null ? null : { stargazerCount: v };
    }
    return new Response(JSON.stringify({ data }), { status: 200 });
  });
}

const repos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ owner: `Owner${i}`, name: `repo-${i}`, stars: i }));

beforeEach(() => {
  vi.stubEnv("GITHUB_TOKEN", "");
  vi.stubEnv("GITHUB_API_BASE", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("refreshStars", () => {
  it("makes no request without a token and returns the snapshot", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const { refreshStars, hasLiveStars } = await load();
    expect(hasLiveStars()).toBe(false);
    expect(await refreshStars(repos(2))).toEqual({
      stars: { "owner0/repo-0": 0, "owner1/repo-1": 1 },
      live: false,
    });
    expect(f).not.toHaveBeenCalled();
  });

  it("queries GraphQL with aliases, auth header and hourly revalidation", async () => {
    vi.stubEnv("GITHUB_TOKEN", "tkn");
    const f = graphqlMock((k) => (k === "a/b" ? 42 : 5));
    vi.stubGlobal("fetch", f);
    const { refreshStars, hasLiveStars } = await load();
    expect(hasLiveStars()).toBe(true);
    const r = await refreshStars([
      { owner: "A", name: "b", stars: 1 },
      { owner: "c", name: "d", stars: 2 },
    ]);
    expect(r).toEqual({ stars: { "a/b": 42, "c/d": 5 }, live: true });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = call(f, 0);
    expect(url).toBe("https://api.github.com/graphql");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tkn");
    expect(init.next?.revalidate).toBe(3600);
    const { query } = bodyOf(init);
    expect(query).toContain('r0: repository(owner: "A", name: "b") { stargazerCount }');
    expect(query).toContain('r1: repository(owner: "c", name: "d") { stargazerCount }');
    expect(query).not.toContain("tkn");
  });

  it("honours GITHUB_API_BASE", async () => {
    vi.stubEnv("GITHUB_TOKEN", "tkn");
    vi.stubEnv("GITHUB_API_BASE", "http://127.0.0.1:9");
    const f = graphqlMock();
    vi.stubGlobal("fetch", f);
    const { refreshStars } = await load();
    await refreshStars(repos(1));
    expect(call(f, 0)[0]).toBe("http://127.0.0.1:9/graphql");
  });

  it("chunks at 100 repositories per query", async () => {
    vi.stubEnv("GITHUB_TOKEN", "tkn");
    const f = graphqlMock(() => 9);
    vi.stubGlobal("fetch", f);
    const { refreshStars } = await load();
    const { stars: r } = await refreshStars(repos(250));
    expect(f).toHaveBeenCalledTimes(3);
    const sizes = [0, 1, 2].map((i) => (bodyOf(call(f, i)[1]).query.match(/stargazerCount/g) ?? []).length);
    expect(sizes.sort((a, b) => b - a)).toEqual([100, 100, 50]);
    expect(Object.keys(r)).toHaveLength(250);
    expect(Object.values(r).every((v) => v === 9)).toBe(true);
  });

  it("keeps the snapshot for missing repos and failed chunks", async () => {
    vi.stubEnv("GITHUB_TOKEN", "tkn");
    let n = 0;
    const ok = graphqlMock((k) => (k === "owner1/repo-1" ? null : 1000));
    const f = vi.fn(async (url: string, init: Init) => {
      if (n++ === 1) return new Response("rate limited", { status: 502 });
      return ok(url, init);
    });
    vi.stubGlobal("fetch", f);
    const { refreshStars } = await load();
    const { stars: r, live } = await refreshStars(repos(200));
    expect(live).toBe(true);
    expect(r["owner0/repo-0"]).toBe(1000);
    expect(r["owner1/repo-1"]).toBe(1); // null in response -> snapshot
    const failedChunk = Object.entries(r).filter(([, v]) => v !== 1000);
    // the second chunk (100 repos) failed and keeps snapshot values, plus owner1
    expect(failedChunk).toHaveLength(101);
  });

  it("keeps the snapshot when fetch throws or the payload is malformed", async () => {
    vi.stubEnv("GITHUB_TOKEN", "tkn");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    let { refreshStars } = await load();
    expect(await refreshStars(repos(2))).toEqual({
      stars: { "owner0/repo-0": 0, "owner1/repo-1": 1 },
      live: false,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { r0: { stargazerCount: "x" } } }))),
    );
    ({ refreshStars } = await load());
    expect((await refreshStars(repos(1))).stars).toEqual({ "owner0/repo-0": 0 });
  });
});
