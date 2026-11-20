// Server-only: reads skills/<slug>/SKILL.md from disk at build/request time.
import { promises as fs } from "node:fs";
import path from "node:path";

export type SkillFile = {
  frontmatter: Record<string, string>;
  body: string;
  raw: string;
};

export function parseSkillFile(raw: string): SkillFile {
  const text = raw.replace(/^﻿/, "");
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { frontmatter: {}, body: text, raw };
  const frontmatter: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
    frontmatter[kv[1]] = v;
  }
  return { frontmatter, body: m[2].replace(/^\s+/, ""), raw };
}

export async function readSkillFile(slug: string): Promise<SkillFile | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "skills", slug, "SKILL.md"),
      "utf8",
    );
    return parseSkillFile(raw);
  } catch {
    return null;
  }
}
