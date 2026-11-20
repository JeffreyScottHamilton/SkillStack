import type { CatalogSkill } from "@/data/catalog";
import { ALIASES, CATEGORY_LABELS } from "@/data/catalog";

/** Lowercase, strip diacritics, drop every non-alphanumeric run. */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const haystackCache = new WeakMap<CatalogSkill, { parts: string[]; joined: string }>();

function haystack(skill: CatalogSkill) {
  let h = haystackCache.get(skill);
  if (!h) {
    const parts = [
      skill.name,
      skill.summary,
      skill.category,
      CATEGORY_LABELS[skill.category] ?? "",
      skill.repo.owner,
      skill.repo.name,
      ...(ALIASES[skill.id] ?? []),
    ].map(normalize);
    h = { parts, joined: parts.join("") };
    haystackCache.set(skill, h);
  }
  return h;
}

export function filterSkills(skills: CatalogSkill[], query: string): CatalogSkill[] {
  const q = normalize(query);
  if (!q) return query.trim() === "" ? skills : [];
  const tokens = query
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);
  return skills.filter((skill) => {
    const { parts, joined } = haystack(skill);
    if (parts.some((p) => p.includes(q))) return true;
    return tokens.every((t) => joined.includes(t));
  });
}
