import skillsData from "./skills.json";

export type RepoRef = { owner: string; name: string };

export type CategoryId =
  | "coding"
  | "design"
  | "video"
  | "ai"
  | "cloud"
  | "security"
  | "docs"
  | "writing"
  | "product"
  | "research"
  | "workflow"
  | "games";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "coding", label: "Coding & engineering" },
  { id: "design", label: "UI & design" },
  { id: "video", label: "Video, audio & animation" },
  { id: "ai", label: "AI & ML" },
  { id: "cloud", label: "Cloud & DevOps" },
  { id: "security", label: "Security" },
  { id: "docs", label: "Docs & office" },
  { id: "writing", label: "Writing, marketing & SEO" },
  { id: "product", label: "Product & business" },
  { id: "research", label: "Research & science" },
  { id: "workflow", label: "Workflow & productivity" },
  { id: "games", label: "Games & 3D" },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;

export type CatalogSkill = {
  id: string;
  name: string;
  summary: string;
  category: CategoryId;
  repo: RepoRef;
  url: string;
};

/** Sorted most-starred repository first; rows link straight to GitHub. */
export const SKILLS: CatalogSkill[] = skillsData as CatalogSkill[];

/** Extra search terms keyed by skill id. */
export const ALIASES: Record<string, string[]> = {
  ...Object.fromEntries(
    SKILLS.filter((s) => s.id.startsWith("juliusbrussee/caveman/")).map((s) => [
      s.id,
      ["cave man"],
    ]),
  ),
  "multica-ai/andrej-karpathy-skills/karpathy-guidelines": ["kaparthy", "karpathy"],
};

export function repoKey(repo: RepoRef): string {
  return `${repo.owner}/${repo.name}`.toLowerCase();
}
