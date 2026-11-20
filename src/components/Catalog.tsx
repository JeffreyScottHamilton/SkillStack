"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Skill } from "@/data/catalog";
import { repoKey } from "@/data/catalog";
import { searchSkills } from "@/lib/search";
import { StarCount } from "./StarCount";
import { StarIcon } from "./StarIcon";

type ViewProps = {
  skills: Skill[];
  stars: Record<string, number | null>;
  query: string;
  kbdLabel?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onQueryChange?: (value: string) => void;
  onShortcut?: (value: string) => void;
  onClear?: () => void;
};

export function CatalogView({
  skills,
  stars,
  query: q,
  kbdLabel = "Ctrl K",
  inputRef,
  onQueryChange,
  onShortcut,
  onClear,
}: ViewProps) {
  const results = searchSkills(skills, q);
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

      <p className="sr-only" aria-live="polite">
        {results.length} {results.length === 1 ? "skill" : "skills"} found
      </p>

      <div className="mt-10 flex justify-end pb-2 text-xs text-muted">GitHub stars</div>
      {results.length === 0 ? (
        <div className="border-t border-line py-10 text-center">
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
        <ul className="divide-y divide-line border-y border-line">
          {results.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/skills/${s.slug}${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                className="flex items-center justify-between gap-4 px-2 py-4 hover:bg-black/[0.03] focus-visible:outline-terracotta"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-sm text-muted">{s.summary}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
                  <StarIcon />
                  <StarCount value={stars[repoKey(s.repo)]} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Catalog({
  skills,
  stars,
}: {
  skills: Skill[];
  stars: Record<string, number | null>;
}) {
  const router = useRouter();
  const q = useSearchParams().get("q") ?? "";
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

  function setQuery(value: string) {
    router.replace(value ? `/?q=${encodeURIComponent(value)}` : "/", { scroll: false });
  }

  return (
    <CatalogView
      skills={skills}
      stars={stars}
      query={q}
      kbdLabel={isMac ? "⌘ K" : "Ctrl K"}
      inputRef={inputRef}
      onQueryChange={setQuery}
      onShortcut={(v) => router.push(`/?q=${encodeURIComponent(v)}`, { scroll: false })}
      onClear={() => setQuery("")}
    />
  );
}
