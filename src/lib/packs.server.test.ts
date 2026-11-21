import { describe, expect, it } from "vitest";
import { getCatalog } from "./catalog.server";
import { getPack, getPacks, loadPackDefs } from "./packs.server";

const defs = loadPackDefs();
const ids = new Set(getCatalog().skills.map((s) => s.id));

describe("packs", () => {
  it("has 16 packs with unique slugs", () => {
    expect(defs.length).toBe(16);
    expect(new Set(defs.map((d) => d.slug)).size).toBe(16);
  });

  it("resolves every id against the catalog, without duplicates", () => {
    for (const d of defs) {
      expect(new Set(d.skills).size, d.slug).toBe(d.skills.length);
      for (const id of d.skills) expect(ids.has(id), `${d.slug}: ${id}`).toBe(true);
    }
  });

  it("returns null for an unknown slug", async () => {
    expect(await getPack("nope")).toBeNull();
  });

  it("count equals the resolved length", async () => {
    const packs = await getPacks();
    expect(packs.length).toBe(16);
    for (const p of packs) {
      const full = await getPack(p.slug);
      expect(full).not.toBeNull();
      expect(p.count).toBe(full!.skills.length);
      expect(p.preview).toEqual(full!.skills.slice(0, 3).map((s) => s.name));
    }
  });
});
