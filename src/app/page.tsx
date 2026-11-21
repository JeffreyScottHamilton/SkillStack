import { Catalog } from "@/components/Catalog";
import { PackGrid } from "@/components/PackGrid";
import { PAGE_SIZE, isCategoryId } from "@/lib/categories";
import { getHome, getLiveCatalog, starsLabel } from "@/lib/catalog.server";
import { getPacks } from "@/lib/packs.server";
import { searchSkills } from "@/lib/search";

const numberFormat = new Intl.NumberFormat("en-US");

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = first(sp.q).slice(0, 200);
  const rawCat = first(sp.cat);
  const cat = isCategoryId(rawCat) ? rawCat : null;

  const catalog = await getLiveCatalog();
  const filtered = q.trim() !== "" || cat !== null;
  const initialResult = filtered
    ? searchSkills(catalog.index, { q, cat, offset: 0, limit: PAGE_SIZE })
    : null;

  return (
    <>
      <h1 className="mt-16 font-serif text-4xl font-semibold sm:text-5xl">Skills for Claude Code</h1>
      <p className="mb-8 mt-3 text-muted">
        {numberFormat.format(catalog.skills.length)} skills from{" "}
        {numberFormat.format(catalog.repos.length)} repos
      </p>
      <Catalog
        // Remount when navigating to a different server-rendered URL.
        key={`${q}\n${cat ?? ""}`}
        initialQuery={q}
        initialCategory={cat}
        initialResult={initialResult}
        home={getHome(catalog)}
        starsLabel={starsLabel(catalog)}
        packs={<PackGrid packs={await getPacks()} />}
      />
    </>
  );
}
