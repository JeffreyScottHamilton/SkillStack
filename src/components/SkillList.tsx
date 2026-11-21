import { CATEGORY_LABELS } from "@/lib/categories";
import type { CatalogSkill } from "@/lib/categories";
import { StarCount } from "./StarCount";
import { StarIcon } from "./StarIcon";

function ExternalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function SkillRow({ skill, showCategory }: { skill: CatalogSkill; showCategory: boolean }) {
  return (
    <li>
      <a
        href={skill.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-4 px-2 py-4 hover:bg-black/[0.03] focus-visible:outline-terracotta"
      >
        <span className="min-w-0">
          <span className="block font-medium">{skill.name}</span>
          <span className="line-clamp-2 text-sm text-muted">{skill.summary}</span>
          <span className="mt-1 block truncate text-xs text-muted/80">
            {skill.repo.owner}/{skill.repo.name}
            {showCategory && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="text-terracotta/90">{CATEGORY_LABELS[skill.category]}</span>
              </>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
          <StarIcon />
          <StarCount value={skill.stars} />
          <span className="ml-2">
            <ExternalIcon />
          </span>
          <span className="sr-only">(opens GitHub in a new tab)</span>
        </span>
      </a>
    </li>
  );
}

export function SkillList({ items, showCategory }: { items: CatalogSkill[]; showCategory: boolean }) {
  return (
    <ul className="divide-y divide-line border-b border-line">
      {items.map((s) => (
        <SkillRow key={s.id} skill={s} showCategory={showCategory} />
      ))}
    </ul>
  );
}
