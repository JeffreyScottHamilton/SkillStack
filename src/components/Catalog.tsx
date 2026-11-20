"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CatalogSkill, CategoryId } from "@/data/catalog";
import { CATEGORIES, SKILLS, repoKey } from "@/data/catalog";
import { filterSkills } from "@/lib/search";
import { StarCount } from "./StarCount";
import { StarIcon } from "./StarIcon";

/** Rows shown per section before "Show all" when nothing is filtered. */
const PREVIEW_ROWS = 8;

const numberFormat = new Intl.NumberFormat("en-US");

function isCategoryId(v: string | null): v is CategoryId {
  return CATEGORIES.some((c) => c.id === v);
}

type ViewProps = {
  stars: Record<string, number | null>;
  query: string;
  category?: CategoryId | null;
  kbdLabel?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onQueryChange?: (value: string) => void;
  onCategoryChange?: (value: CategoryId | null) => void;
  onShortcut?: (value: string) => void;
  onClear?: () => void;
};

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

function SkillRow({ skill, stars }: { skill: CatalogSkill; stars: number | null | undefined }) {
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
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
          <StarIcon />
          <StarCount value={stars} />
          <span className="ml-2">
            <ExternalIcon />
          </span>
          <span className="sr-only">(opens GitHub in a new tab)</span>
        </span>
      </a>
    </li>
  );
}

export function CatalogView({
  stars,
  query: q,
  category = null,
  kbdLabel = "Ctrl K",
  inputRef,
  onQueryChange,
  onCategoryChange,
  onShortcut,
  onClear,
}: ViewProps) {
  const [expanded, setExpanded] = useState<Set<CategoryId>>(() => new Set());
  const matches = filterSkills(SKILLS, q);
  const results = category ? matches.filter((s) => s.category === category) : matches;
  const filtered = q.trim() !== "" || category !== null;

  const byCategory = new Map<CategoryId, CatalogSkill[]>();
  for (const s of results) {
    const list = byCategory.get(s.category);
    if (list) list.push(s);
    else byCategory.set(s.category, [s]);
  }
  const matchCounts = new Map<CategoryId, number>();
  for (const s of matches) matchCounts.set(s.category, (matchCounts.get(s.category) ?? 0) + 1);

  const countLine = filtered
    ? `${numberFormat.format(results.length)} ${results.length === 1 ? "match" : "matches"}`
    : `${numberFormat.format(results.length)} skills`;

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${
      active
        ? "border-terracotta bg-terracotta text-white"
        : "border-line bg-surface text-ink hover:border-terracotta"
    }`;

  return (
    <div>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => onQueryChange?.(e.target.value)}
          placeholder="Search skills…"
          aria-label="Search skills"
          autoComplete="off"
          spellCheck={false}
          className="h-14 w-full rounded-xl border border-line bg-surface pl-11 pr-24 text-base placeholder:text-muted focus-visible:outline-terracotta"
        />
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md bg-ivory px-2 py-1 font-sans text-xs text-muted sm:block"
        >
          {kbdLabel}
        </kbd>
      </div>

      <div className="mt-4 flex gap-8 text-sm text-terracotta">
        <button
          type="button"
          onClick={() => onShortcut?.("Caveman")}
          className="rounded hover:text-terracotta-hover"
        >
          Caveman
        </button>
        <button
          type="button"
          onClick={() => onShortcut?.("Karpathy")}
          className="rounded hover:text-terracotta-hover"
        >
          Karpathy
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button
          type="button"
          aria-pressed={category === null}
          onClick={() => onCategoryChange?.(null)}
          className={chipClass(category === null)}
        >
          All <span className="opacity-70">{numberFormat.format(matches.length)}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            onClick={() => onCategoryChange?.(category === c.id ? null : c.id)}
            className={chipClass(category === c.id)}
          >
            {c.label}{" "}
            <span className="opacity-70">{numberFormat.format(matchCounts.get(c.id) ?? 0)}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {countLine}
      </p>

      <div className="mt-10 flex items-end justify-between gap-4 border-b border-line pb-2 text-xs text-muted">
        <span className="text-sm text-ink">{countLine}</span>
        <span className="text-right">
          <span className="block">GitHub stars</span>
          <span className="block">Stars are for the whole repository, not the individual skill.</span>
        </span>
      </div>

      {results.length === 0 ? (
        <div className="border-b border-line py-10 text-center">
          <p className="text-muted">No skills match “{q}”.</p>
          <button
            type="button"
            onClick={() => onClear?.()}
            className="mt-3 rounded text-sm text-terracotta hover:text-terracotta-hover"
          >
            Clear search
          </button>
        </div>
      ) : (
        CATEGORIES.map((c) => {
          const rows = byCategory.get(c.id);
          if (!rows) return null;
          const showAll = filtered || expanded.has(c.id);
          const visible = showAll ? rows : rows.slice(0, PREVIEW_ROWS);
          return (
            <section key={c.id} aria-labelledby={`cat-${c.id}`} className="mt-10">
              <h2
                id={`cat-${c.id}`}
                className="flex items-baseline justify-between border-b border-line pb-2 font-serif text-xl font-semibold"
              >
                <span>{c.label}</span>
                <span className="font-sans text-sm font-normal text-muted">
                  {numberFormat.format(rows.length)}
                </span>
              </h2>
              <ul className="divide-y divide-line border-b border-line">
                {visible.map((s) => (
                  <SkillRow key={s.id} skill={s} stars={stars[repoKey(s.repo)]} />
                ))}
              </ul>
              {!showAll && rows.length > PREVIEW_ROWS && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => new Set(prev).add(c.id))}
                  className="mt-3 rounded text-sm text-terracotta hover:text-terracotta-hover"
                >
                  Show all {numberFormat.format(rows.length)}
                </button>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function buildUrl(q: string, cat: CategoryId | null): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cat) params.set("cat", cat);
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

export function Catalog({ stars }: { stars: Record<string, number | null> }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const rawCat = params.get("cat");
  const category = isCategoryId(rawCat) ? rawCat : null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Platform is only known on the client; neutral hint until mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CatalogView
      stars={stars}
      query={q}
      category={category}
      kbdLabel={isMac ? "⌘ K" : "Ctrl K"}
      inputRef={inputRef}
      onQueryChange={(v) => router.replace(buildUrl(v, category), { scroll: false })}
      onCategoryChange={(c) => router.replace(buildUrl(q, c), { scroll: false })}
      onShortcut={(v) => router.push(buildUrl(v, null), { scroll: false })}
      onClear={() => router.replace("/", { scroll: false })}
    />
  );
}
