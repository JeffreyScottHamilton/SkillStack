import type { Skill } from "@/data/catalog";

/** Lowercase, strip diacritics, drop every non-alphanumeric run. */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function haystackParts(skill: Skill): string[] {
  return [
    skill.name,
    skill.summary,
    skill.slug,
    skill.invocation ?? "",
    ...skill.tags,
    ...skill.aliases,
  ].map(normalize);
}

export function searchSkills(skills: Skill[], query: string): Skill[] {
  const q = normalize(query);
  if (!q) return query.trim() === "" ? skills : [];
  const tokens = query
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);
  return skills.filter((skill) => {
    const parts = haystackParts(skill);
    if (parts.some((p) => p.includes(q))) return true;
    const joined = parts.join("");
    return tokens.every((t) => joined.includes(t));
  });
}
