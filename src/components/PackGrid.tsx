import Link from "next/link";
import type { PackSummary } from "@/lib/packs.server";

export function PackGrid({ packs }: { packs: PackSummary[] }) {
  if (packs.length === 0) return null;
  return (
    <section aria-labelledby="packs" className="mt-10">
      <h2 id="packs" className="border-b border-line pb-2 font-serif text-xl font-semibold">
        Packs
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {packs.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/packs/${p.slug}`}
              className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 hover:border-terracotta focus-visible:outline-terracotta"
            >
              <span className="font-medium">{p.name}</span>
              <span className="mt-1 line-clamp-3 text-sm text-muted">{p.description}</span>
              <span className="mt-auto pt-3 text-xs text-terracotta">{p.count} skills</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
