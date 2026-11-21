// Server-only: reads data/packs.json from disk and resolves it against the catalog.
import fs from "node:fs";
import path from "node:path";
import type { CatalogSkill } from "./categories";
import { getLiveCatalog } from "./catalog.server";

export type PackDef = { slug: string; name: string; description: string; skills: string[] };
type PacksFile = { version: 1; packs: PackDef[] };

export type PackSummary = {
  slug: string;
  name: string;
  description: string;
  count: number;
  preview: string[];
};

export type Pack = { slug: string; name: string; description: string; skills: CatalogSkill[] };

let defs: PackDef[] | null = null;

export function loadPackDefs(): PackDef[] {
  if (!defs) {
    const file = path.join(process.cwd(), "data", "packs.json");
    defs = (JSON.parse(fs.readFileSync(file, "utf8")) as PacksFile).packs;
  }
  return defs;
}

function resolve(def: PackDef, byId: Map<string, CatalogSkill>): Pack {
  const skills: CatalogSkill[] = [];
  for (const id of def.skills) {
    const s = byId.get(id);
    if (s) skills.push(s);
  }
  return { slug: def.slug, name: def.name, description: def.description, skills };
}

async function byIdMap(): Promise<Map<string, CatalogSkill>> {
  const catalog = await getLiveCatalog();
  return new Map(catalog.skills.map((s) => [s.id, s]));
}

export async function getPacks(): Promise<PackSummary[]> {
  const byId = await byIdMap();
  return loadPackDefs().map((d) => {
    const p = resolve(d, byId);
    return {
      slug: p.slug,
      name: p.name,
      description: p.description,
      count: p.skills.length,
      preview: p.skills.slice(0, 3).map((s) => s.name),
    };
  });
}

export async function getPack(slug: string): Promise<Pack | null> {
  const def = loadPackDefs().find((d) => d.slug === slug);
  if (!def) return null;
  return resolve(def, await byIdMap());
}
