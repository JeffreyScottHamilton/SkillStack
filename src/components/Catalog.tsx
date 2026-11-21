"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CategoryId, HomeData, SearchResult } from "@/lib/categories";
import { CATEGORIES, CATEGORY_LABELS, PAGE_SIZE, isCategoryId } from "@/lib/categories";
import { SkillList } from "./SkillList";

const DEBOUNCE_MS = 150;

const numberFormat = new Intl.NumberFormat("en-US");
const fmt = (n: number) => numberFormat.format(n);

function resultKey(q: string, cat: CategoryId | null): string {
  return `${q}\n${cat ?? ""}`;
}

function buildUrl(q: string, cat: CategoryId | null): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cat) params.set("cat", cat);
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

function apiUrl(q: string, cat: CategoryId | null, offset: number): string {
  const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE) });
  if (q) params.set("q", q);
  if (cat) params.set("cat", cat);
  return `/api/skills?${params}`;
}

type ResultState = SearchResult & { key: string; error: boolean };

type Props = {
  initialQuery: string;
  initialCategory: CategoryId | null;
  /** Server-rendered first page for the initial q/cat; null on the home view. */
  initialResult: SearchResult | null;
  home: HomeData;
  starsLabel: string;
  /** Server-rendered packs grid, shown on the home view only. */
  packs?: ReactNode;
};

export function Catalog({ initialQuery, initialCategory, initialResult, home, starsLabel, packs }: Props) {
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [cat, setCat] = useState<CategoryId | null>(initialCategory);
  const [res, setRes] = useState<ResultState>(() => ({
    key: initialResult ? resultKey(initialQuery, initialCategory) : "",
    error: false,
    total: initialResult?.total ?? 0,
    counts: initialResult?.counts ?? home.counts,
    items: initialResult?.items ?? [],
  }));
  const [more, setMore] = useState<{ loading: boolean; error: boolean }>({
    loading: false,
    error: false,
  });
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHome = query.trim() === "" && cat === null;
  const key = resultKey(query, cat);
  const current = !isHome && res.key === key;
  const loading = !isHome && res.key !== key;

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
    function onPop() {
      const p = new URLSearchParams(window.location.search);
      const q = p.get("q") ?? "";
      const c = p.get("cat");
      setInput(q);
      setQuery(q);
      setCat(isCategoryId(c) ? c : null);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Typing: commit the query and update ?q= (replace) after a short pause.
  useEffect(() => {
    if (input === query) return;
    const t = setTimeout(() => {
      setQuery(input);
      window.history.replaceState(null, "", buildUrl(input, cat));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input, query, cat]);

  // Fetch the first page whenever the committed query/category changes.
  const resKey = res.key;
  useEffect(() => {
    if (isHome || resKey === key) return;
    const ctrl = new AbortController();
    fetch(apiUrl(query, cat, 0), { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json() as Promise<SearchResult>;
      })
      .then((data) => {
        setRes({ ...data, key, error: false });
        setMore({ loading: false, error: false });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        void err;
        setRes((prev) => ({ ...prev, key, error: true, total: 0, items: [] }));
      });
    return () => ctrl.abort();
  }, [isHome, key, resKey, query, cat]);

  function navigate(q: string, c: CategoryId | null) {
    setInput(q);
    setQuery(q);
    setCat(c);
    window.history.pushState(null, "", buildUrl(q, c));
  }

  async function loadMore() {
    const k = key;
    setMore({ loading: true, error: false });
    try {
      const r = await fetch(apiUrl(query, cat, res.items.length));
      if (!r.ok) throw new Error(`status ${r.status}`);
      const data = (await r.json()) as SearchResult;
      setRes((prev) => {
        if (prev.key !== k) return prev;
        const seen = new Set(prev.items.map((s) => s.id));
        return { ...prev, items: [...prev.items, ...data.items.filter((s) => !seen.has(s.id))] };
      });
      setMore({ loading: false, error: false });
    } catch {
      setMore({ loading: false, error: true });
    }
  }

  const counts = isHome ? home.counts : res.counts;
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const homeTotal = Object.values(home.counts).reduce((a, b) => a + b, 0);

  const countLine = isHome
    ? `${fmt(homeTotal)} skills`
    : loading
      ? "Searching…"
      : res.error
        ? "Couldn't load results."
        : `${fmt(res.total)} ${res.total === 1 ? "match" : "matches"}`;

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
      active
        ? "border-terracotta bg-terracotta text-white"
        : "border-line bg-surface text-ink hover:border-terracotta"
    }`;

  const linkClass = "rounded text-sm text-terracotta hover:text-terracotta-hover";

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
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
          {isMac ? "⌘ K" : "Ctrl K"}
        </kbd>
      </div>

      <div className="mt-4 flex gap-8 text-sm text-terracotta">
        <button type="button" onClick={() => navigate("Caveman", null)} className="rounded hover:text-terracotta-hover">
          Caveman
        </button>
        <button type="button" onClick={() => navigate("Karpathy", null)} className="rounded hover:text-terracotta-hover">
          Karpathy
        </button>
      </div>

      <div
        className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          aria-pressed={cat === null}
          onClick={() => navigate(input, null)}
          className={chipClass(cat === null)}
        >
          All <span className="opacity-70">{fmt(allCount)}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={cat === c.id}
            onClick={() => navigate(input, cat === c.id ? null : c.id)}
            className={chipClass(cat === c.id)}
          >
            {c.label} <span className="opacity-70">{fmt(counts[c.id] ?? 0)}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {countLine}
      </p>

      <div className="mt-10 flex items-end justify-between gap-4 border-b border-line pb-2 text-xs text-muted">
        <span className="text-sm text-ink">{countLine}</span>
        <span className="text-right">
          <span className="block">{starsLabel}</span>
          <span className="block">Stars are for the whole repository, not the individual skill.</span>
        </span>
      </div>

      {isHome ? (
        <>
          {packs}
          <section aria-labelledby="popular" className="mt-10">
            <h2 id="popular" className="border-b border-line pb-2 font-serif text-xl font-semibold">
              Most popular
            </h2>
            <SkillList items={home.popular} showCategory />
          </section>
          {home.sections.map((sec) => (
            <section key={sec.id} aria-labelledby={`cat-${sec.id}`} className="mt-10">
              <h2
                id={`cat-${sec.id}`}
                className="flex items-baseline justify-between gap-4 border-b border-line pb-2 font-serif text-xl font-semibold"
              >
                <span>{sec.label}</span>
                <a
                  href={buildUrl("", sec.id)}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    navigate("", sec.id);
                    window.scrollTo({ top: 0 });
                  }}
                  className={`shrink-0 font-sans font-normal ${linkClass}`}
                >
                  View all {fmt(sec.total)} →
                </a>
              </h2>
              <SkillList items={sec.items} showCategory={false} />
            </section>
          ))}
        </>
      ) : res.error && current ? (
        <div className="border-b border-line py-10 text-center">
          <p className="text-muted">Couldn&apos;t load results. Try again.</p>
          <button
            type="button"
            onClick={() => setRes((prev) => ({ ...prev, key: "", error: false }))}
            className={`mt-3 ${linkClass}`}
          >
            Try again
          </button>
        </div>
      ) : loading && res.items.length === 0 ? (
        <p className="border-b border-line py-10 text-center text-muted">Loading…</p>
      ) : current && res.total === 0 ? (
        <div className="border-b border-line py-10 text-center">
          <p className="text-muted">
            No skills match “{query}”{cat ? ` in ${CATEGORY_LABELS[cat]}` : ""}.
          </p>
          <button type="button" onClick={() => navigate("", null)} className={`mt-3 ${linkClass}`}>
            Clear search
          </button>
        </div>
      ) : (
        <div aria-busy={loading} className={loading ? "opacity-60 transition-opacity" : undefined}>
          <SkillList items={res.items} showCategory />
          {current && (
            <div className="mt-4 flex flex-col items-center gap-3 text-sm text-muted">
              <span>
                Showing {fmt(res.items.length)} of {fmt(res.total)}
              </span>
              {res.items.length < res.total && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={more.loading}
                  className="rounded-full border border-line bg-surface px-4 py-2 text-ink hover:border-terracotta disabled:opacity-60"
                >
                  {more.loading ? "Loading…" : "Load more"}
                </button>
              )}
              {more.error && <span>Couldn&apos;t load results. Try again.</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
