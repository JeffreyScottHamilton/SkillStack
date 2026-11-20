import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Item = { full_name: string; stargazers_count: unknown };
const ok = (items: Item[]) =>
  new Response(JSON.stringify({ total_count: items.length, items }), { status: 200 });

async function load() {
  vi.resetModules();
  return (await import("./stars")).getStarCounts;
}

const call = (f: ReturnType<typeof vi.fn>, i: number) =>
  f.mock.calls[i] as unknown as [string, RequestInit];
const qOf = (url: string) => new URL(url).searchParams.get("q") ?? "";

beforeEach(() => {
  vi.stubEnv("GITHUB_TOKEN", "");
  vi.stubEnv("GITHUB_API_BASE", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getStarCounts", () => {
  it("uses the batched search endpoint and maps full_name to stargazers_count", async () => {
    const f = vi.fn(async () =>
      ok([
        { full_name: "A/b", stargazers_count: 42 },
        { full_name: "c/D", stargazers_count: 5 },
      ]),
    );
    vi.stubGlobal("fetch", f);
    const get = await load();
    const r = await get([
      { owner: "A", name: "b" },
      { owner: "c", name: "d" },
    ]);
    expect(r).toEqual({ "a/b": 42, "c/d": 5 });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = call(f, 0);
    expect(url.startsWith("https://api.github.com/search/repositories?")).toBe(true);
    expect(new URL(url).searchParams.get("per_page")).toBe("100");
    expect(qOf(url)).toBe("repo:a/b repo:c/d");
    expect((init as RequestInit & { next?: { revalidate?: number } }).next?.revalidate).toBe(3600);
  });

  it("returns 0 rather than null", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok([{ full_name: "a/b", stargazers_count: 0 }])));
    const get = await load();
    expect((await get([{ owner: "a", name: "b" }]))["a/b"]).toBe(0);
  });

  it("returns null for a repo missing from the results", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok([{ full_name: "a/b", stargazers_count: 3 }])));
    const get = await load();
    expect(
      await get([
        { owner: "a", name: "b" },
        { owner: "x", name: "y" },
      ]),
    ).toEqual({ "a/b": 3, "x/y": null });
  });

  it("dedupes repos case-insensitively", async () => {
    const f = vi.fn(async () => ok([{ full_name: "Foo/Bar", stargazers_count: 1 }]));
    vi.stubGlobal("fetch", f);
    const get = await load();
    const r = await get([
      { owner: "Foo", name: "Bar" },
      { owner: "foo", name: "bar" },
    ]);
    expect(f).toHaveBeenCalledTimes(1);
    expect(qOf(call(f, 0)[0])).toBe("repo:foo/bar");
    expect(r).toEqual({ "foo/bar": 1 });
  });

  it("returns null on non-2xx with no prior value", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 403 })));
    const get = await load();
    expect((await get([{ owner: "a", name: "b" }]))["a/b"]).toBeNull();
  });

  it("falls back to the last known value when a chunk fails", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(ok([{ full_name: "a/b", stargazers_count: 7 }]))
      .mockRejectedValueOnce(new Error("down"));
    vi.stubGlobal("fetch", f);
    const get = await load();
    const repo = [{ owner: "a", name: "b" }];
    expect((await get(repo))["a/b"]).toBe(7);
    expect((await get(repo))["a/b"]).toBe(7);
  });

  it("chunks queries so each q is at most 250 characters", async () => {
    const repos = Array.from({ length: 66 }, (_, i) => ({
      owner: `owner-number-${i}`,
      name: `some-repository-${i}`,
    }));
    const f = vi.fn(async (url: string) => {
      const names = qOf(url)
        .split(" ")
        .map((t) => t.replace(/^repo:/, ""));
      return ok(names.map((n) => ({ full_name: n, stargazers_count: 1 })));
    });
    vi.stubGlobal("fetch", f);
    const get = await load();
    const r = await get(repos);
    expect(f.mock.calls.length).toBeGreaterThan(1);
    const seen: string[] = [];
    for (let i = 0; i < f.mock.calls.length; i++) {
      const q = qOf(call(f, i)[0]);
      expect(q.length).toBeLessThanOrEqual(250);
      seen.push(...q.split(" "));
    }
    expect(seen).toHaveLength(66);
    expect(Object.values(r).every((v) => v === 1)).toBe(true);
  });

  it("only fails the affected chunk", async () => {
    const repos = Array.from({ length: 30 }, (_, i) => ({
      owner: `owner-number-${i}`,
      name: `some-repository-${i}`,
    }));
    let n = 0;
    const f = vi.fn(async (url: string) => {
      if (n++ === 0) return new Response("rate limited", { status: 403 });
      const names = qOf(url)
        .split(" ")
        .map((t) => t.replace(/^repo:/, ""));
      return ok(names.map((x) => ({ full_name: x, stargazers_count: 2 })));
    });
    vi.stubGlobal("fetch", f);
    const get = await load();
    const r = await get(repos);
    const vals = Object.values(r);
    expect(vals).toContain(null);
    expect(vals).toContain(2);
  });

  it("sends Authorization only when GITHUB_TOKEN is set", async () => {
    const f = vi.fn(async () => ok([{ full_name: "a/b", stargazers_count: 1 }]));
    vi.stubGlobal("fetch", f);
    let get = await load();
    await get([{ owner: "a", name: "b" }]);
    const h1 = call(f, 0)[1].headers as Record<string, string>;
    expect(h1.Authorization).toBeUndefined();

    vi.stubEnv("GITHUB_TOKEN", "tkn");
    get = await load();
    await get([{ owner: "a", name: "b" }]);
    const h2 = call(f, 1)[1].headers as Record<string, string>;
    expect(h2.Authorization).toBe("Bearer tkn");
  });
});
