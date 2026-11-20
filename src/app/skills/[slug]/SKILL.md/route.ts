import { SKILLS } from "@/data/catalog";
import { readSkillFile } from "@/lib/skill-file";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SKILLS.filter((s) => s.origin === "original").map((s) => ({ slug: s.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const skill = SKILLS.find((s) => s.slug === slug && s.origin === "original");
  const file = skill ? await readSkillFile(slug) : null;
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.raw, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="SKILL.md"',
    },
  });
}
