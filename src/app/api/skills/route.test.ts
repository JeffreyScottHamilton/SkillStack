import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

async function get(qs: string) {
  const res = await GET(new Request(`http://localhost/api/skills${qs}`));
  return { res, body: (await res.json()) as { total: number; counts: Record<string, number>; items: { id: string; category: string }[] } };
}

describe("GET /api/skills", () => {
  // Snapshot stars only: never reach GitHub from unit tests.
  beforeAll(() => vi.stubEnv("GITHUB_TOKEN", ""));
  afterAll(() => vi.unstubAllEnvs());

  it("returns caveman first with cache headers", async () => {
    const { res, body } = await get("?q=caveman");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(body.items[0].id).toBe("juliusbrussee/caveman/caveman");
    expect(body.total).toBeGreaterThan(0);
    expect(typeof body.counts.coding).toBe("number");
  });

  it("paginates a category", async () => {
    const { body } = await get("?cat=video&offset=50&limit=50");
    expect(body.items).toHaveLength(50);
    expect(body.items.every((s) => s.category === "video")).toBe(true);
    expect(body.total).toBe(1308);
  });

  it("ignores a bad category and clamps offset/limit", async () => {
    const { body } = await get("?cat=nope&offset=-3&limit=5000");
    expect(body.total).toBe(14815);
    expect(body.items).toHaveLength(100);
    const { body: b2 } = await get("?limit=abc&offset=xyz");
    expect(b2.items).toHaveLength(50);
  });
});
