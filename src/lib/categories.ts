// Client-safe: types and category metadata only. The catalog data itself lives
// in data/catalog.json and is loaded by src/lib/catalog.server.ts on the server.

/** Rows per page of results in the UI. */
export const PAGE_SIZE = 50;

export type RepoRef = { owner: string; name: string };

export const CATEGORIES = [
  { id: "coding", label: "Coding & engineering" },
  { id: "design", label: "UI & design" },
  { id: "video", label: "Video, audio & animation" },
  { id: "ai", label: "AI & agents" },
  { id: "data", label: "Data & analytics" },
  { id: "cloud", label: "Cloud & DevOps" },
  { id: "security", label: "Security" },
  { id: "docs", label: "Docs & office" },
  { id: "writing", label: "Writing & marketing" },
  { id: "product", label: "Product & business" },
  { id: "research", label: "Research & science" },
  { id: "workflow", label: "Workflow & productivity" },
  { id: "games", label: "Games & 3D" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((c) => c.id);

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;

export function isCategoryId(v: unknown): v is CategoryId {
  return typeof v === "string" && (CATEGORY_IDS as string[]).includes(v);
}

export type CatalogSkill = {
  /** `<owner>/<repo>/<name>`, lowercased. */
  id: string;
  name: string;
  summary: string;
  category: CategoryId;
  repo: RepoRef;
  /** Repository-level GitHub star count. */
  stars: number;
  url: string;
};

export type SearchResult = {
  total: number;
  /** Matches per category for the query, ignoring the category filter. */
  counts: Record<CategoryId, number>;
  items: CatalogSkill[];
};

export type HomeSection = { id: CategoryId; label: string; total: number; items: CatalogSkill[] };

/** Data for the unfiltered home view. */
export type HomeData = {
  popular: CatalogSkill[];
  sections: HomeSection[];
  counts: Record<CategoryId, number>;
};

export function repoKey(repo: RepoRef): string {
  return `${repo.owner}/${repo.name}`.toLowerCase();
}

export function emptyCounts(): Record<CategoryId, number> {
  return Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])) as Record<CategoryId, number>;
}
