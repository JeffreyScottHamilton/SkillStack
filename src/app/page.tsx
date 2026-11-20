import { Suspense } from "react";
import { SKILLS } from "@/data/catalog";
import { getStarCounts } from "@/lib/stars";
import { Catalog, CatalogView } from "@/components/Catalog";

export const revalidate = 3600;

export default async function Home() {
  const stars = await getStarCounts(SKILLS.map((s) => s.repo));
  return (
    <>
      <h1 className="mb-8 mt-16 font-serif text-4xl font-semibold sm:text-5xl">
        Skills for Claude Code
      </h1>
      <Suspense fallback={<CatalogView skills={SKILLS} stars={stars} query="" />}>
        <Catalog skills={SKILLS} stars={stars} />
      </Suspense>
    </>
  );
}
