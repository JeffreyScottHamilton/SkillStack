import { describe, expect, it } from "vitest";
import { SKILLS } from "@/data/catalog";
import { filterSkills, normalize } from "./search";

const ids = (q: string) => filterSkills(SKILLS, q).map((s) => s.id);

describe("normalize", () => {
  it("collapses case, spaces and punctuation", () => {
    expect(normalize("Cave-Man")).toBe("caveman");
    expect(normalize("cave man")).toBe("caveman");
    expect(normalize("Café")).toBe("cafe");
  });
});

describe("filterSkills", () => {
  it.each(["caveman", "cave man", "CAVE-MAN"])("finds caveman for %s", (q) => {
    expect(ids(q)).toContain("juliusbrussee/caveman/caveman");
  });
  it.each(["Karpathy", "Kaparthy"])("finds karpathy-guidelines for %s", (q) => {
    expect(ids(q)).toContain("multica-ai/andrej-karpathy-skills/karpathy-guidelines");
  });
  it("matches words in any order", () => {
    expect(ids("notes release")).toContain("jeffreyscotthamilton/skillstack/draft-release-notes");
  });
  it("matches repo owner and name", () => {
    expect(ids("andrej-karpathy-skills")).toContain(
      "multica-ai/andrej-karpathy-skills/karpathy-guidelines",
    );
  });
  it("matches category labels", () => {
    const hits = filterSkills(SKILLS, "Games & 3D");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((s) => s.category === "games")).toBe(true);
  });
  it("returns nothing for nonsense", () => {
    expect(ids("zzqqxxj")).toEqual([]);
  });
  it("returns nothing for punctuation-only query", () => {
    expect(ids("!!!")).toEqual([]);
  });
  it("returns all for whitespace-only query", () => {
    expect(ids("   ")).toHaveLength(SKILLS.length);
  });
  it("returns all for empty query", () => {
    expect(ids("")).toHaveLength(SKILLS.length);
  });
});
