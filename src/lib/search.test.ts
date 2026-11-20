import { describe, expect, it } from "vitest";
import { SKILLS } from "@/data/catalog";
import { normalize, searchSkills } from "./search";

const slugs = (q: string) => searchSkills(SKILLS, q).map((s) => s.slug);

describe("normalize", () => {
  it("collapses case, spaces and punctuation", () => {
    expect(normalize("Cave-Man")).toBe("caveman");
    expect(normalize("cave man")).toBe("caveman");
    expect(normalize("Café")).toBe("cafe");
  });
});

describe("searchSkills", () => {
  it.each(["caveman", "cave man", "CAVE-MAN"])("finds caveman for %s", (q) => {
    expect(slugs(q)).toContain("caveman");
  });
  it.each(["Karpathy", "Kaparthy"])("finds karpathy-guidelines for %s", (q) => {
    expect(slugs(q)).toEqual(["karpathy-guidelines"]);
  });
  it("matches words in any order", () => {
    expect(slugs("notes release")).toContain("draft-release-notes");
  });
  it("returns nothing for nonsense", () => {
    expect(slugs("zzz")).toEqual([]);
  });
  it("returns all for empty query", () => {
    expect(slugs("")).toHaveLength(5);
  });
});
