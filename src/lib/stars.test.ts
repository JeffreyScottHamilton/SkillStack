import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ok = (n: unknown) =>
  new Response(JSON.stringify({ stargazers_count: n }), { status: 200 });

async function load() {
  vi.resetModules();
  return (await import("./stars")).getStarCounts;
}

beforeEach(() => {
  vi.stubEnv("GITHUB_TOKEN", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getStarCounts", () => {
  it("returns stargazers_count", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok(42)));
    const get = await load();
    expect(await get([{ owner: "A", name: "b" }])).toEqual({ "a/b": 42 });
  });

  it("returns 0 rather than null", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok(0)));
    const get = await load();
    expect((await get([{ owner: "a", name: "b" }]))["a/b"]).toBe(0);
  });

  it("dedupes repos case-insensitively", async () => {
    const f = vi.fn(async () => ok(1));
    vi.stubGlobal("fetch", f);
    const get = await load();
    const r = await get([
      { owner: "Foo", name: "Bar" },
      { owner: "foo", name: "bar" },
    ]);
    expect(f).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ "foo/bar": 1 });
  });

  it("returns null on non-2xx with no prior value", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    const get = await load();
    expect((await get([{ owner: "a", name: "b" }]))["a/b"]).toBeNull();
  });

  it("falls back to the last known value after a failure", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(ok(7))
      .mockRejectedValueOnce(new Error("down"));
    vi.stubGlobal("fetch", f);
    const get = await load();
    const repo = [{ owner: "a", name: "b" }];
    expect((await get(repo))["a/b"]).toBe(7);
    expect((await get(repo))["a/b"]).toBe(7);
  });

  it("sends Authorization only when GITHUB_TOKEN is set", async () => {
    const f = vi.fn(async () => ok(1));
    vi.stubGlobal("fetch", f);
    let get = await load();
    await get([{ owner: "a", name: "b" }]);
    const h1 = (f.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(h1.Authorization).toBeUndefined();

    vi.stubEnv("GITHUB_TOKEN", "tkn");
    get = await load();
    await get([{ owner: "a", name: "b" }]);
    const h2 = (f.mock.calls[1] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(h2.Authorization).toBe("Bearer tkn");
  });
});
