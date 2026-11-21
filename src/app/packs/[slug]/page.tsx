import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillList } from "@/components/SkillList";
import { starsLabel, getLiveCatalog } from "@/lib/catalog.server";
import { getPack, loadPackDefs } from "@/lib/packs.server";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return loadPackDefs().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getPack(slug);
  if (!pack) return {};
  return { title: `${pack.name} pack · Skill Stacks`, description: pack.description };
}

export default async function PackPage({ params }: { params: Params }) {
  const { slug } = await params;
  const pack = await getPack(slug);
  if (!pack) notFound();
  const others = loadPackDefs().filter((d) => d.slug !== pack.slug);
  const label = starsLabel(await getLiveCatalog());

  return (
    <>
      <Link href="/" className="mt-10 inline-block rounded text-sm text-terracotta hover:text-terracotta-hover">
        ← All skills
      </Link>
      <h1 className="mt-6 font-serif text-4xl font-semibold sm:text-5xl">{pack.name} pack</h1>
      <p className="mt-3 text-muted">{pack.description}</p>
      <p className="mb-8 mt-1 text-sm text-muted">{pack.skills.length} skills</p>
      <div className="flex items-end justify-between gap-4 border-b border-line pb-2 text-xs text-muted">
        <span>{label}</span>
        <span className="text-right">Stars are for the whole repository, not the individual skill.</span>
      </div>
      <SkillList items={pack.skills} showCategory />
      <section aria-labelledby="other-packs" className="mt-12">
        <h2 id="other-packs" className="border-b border-line pb-2 font-serif text-xl font-semibold">
          Other packs
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/packs/${d.slug}`}
                className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-sm hover:border-terracotta"
              >
                {d.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
