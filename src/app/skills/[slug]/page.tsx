import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  SKILLS,
  getSkill,
  rawSkillUrl,
  repoKey,
  skillFileUrl,
  sourceUrl,
} from "@/data/catalog";
import { SITE } from "@/config/site";
import { getStarCounts } from "@/lib/stars";
import { formatStars } from "@/lib/format";
import { readSkillFile } from "@/lib/skill-file";
import { BackLink } from "@/components/BackLink";
import { CodeBox } from "@/components/CodeBox";
import { StarIcon } from "@/components/StarIcon";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SKILLS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) return { title: SITE.name };
  return { title: `${skill.name} · ${SITE.name}`, description: skill.summary };
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-10 font-serif text-xl font-semibold">{children}</h2>;
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();

  const key = repoKey(skill.repo);
  const stars = (await getStarCounts([skill.repo]))[key];
  const file = skill.origin === "original" ? await readSkillFile(skill.slug) : null;
  const inv = skill.invocation;
  const example = inv
    ? `/${inv}${skill.exampleArgs ? ` ${skill.exampleArgs}` : ""}`
    : null;
  const src = sourceUrl(skill);

  return (
    <article className="mt-10">
      <BackLink />
      <h1 className="mt-8 font-serif text-4xl font-semibold">{skill.name}</h1>
      <p className="mt-3 text-lg">{skill.summary}</p>
      <p className="mt-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <StarIcon />
          {typeof stars === "number" ? (
            <span>{formatStars(stars)}</span>
          ) : (
            <span aria-label="Star count unavailable">—</span>
          )}{" "}
          GitHub stars on {skill.repo.owner}/{skill.repo.name}
        </span>
        <br />
        Repository-level count from GitHub, refreshed hourly; not a rating of this skill.
      </p>

      <H2>Use it</H2>
      {example ? (
        skill.pluginInvocation ? (
          <>
            <p className="mb-2 text-sm text-muted">After the plugin install below:</p>
            <CodeBox text={`/${skill.pluginInvocation}`} />
            <p className="mb-2 mt-3 text-sm text-muted">
              If you copy the folder into a skills directory:
            </p>
            <CodeBox text={example} />
          </>
        ) : (
          <CodeBox text={example} />
        )
      ) : (
        <p className="text-muted">This skill is not invoked with a slash command.</p>
      )}
      {skill.slug === "caveman" && (
        <p className="mt-3 text-sm text-muted">
          Say “stop caveman” to turn it off. Upstream also supports{" "}
          <code>/caveman ultra</code>.
        </p>
      )}
      <p className="mt-3 text-sm text-muted">
        Skills are invoked by name. See the{" "}
        <a
          className="text-terracotta hover:text-terracotta-hover"
          href="https://code.claude.com/docs/en/skills"
          target="_blank"
          rel="noopener noreferrer"
        >
          Claude Code skills docs
        </a>
        .
      </p>

      <H2>Install</H2>
      {skill.install?.map((m) => (
        <div key={m.label} className="mb-5">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{m.label}</span>
            <a
              className="text-muted hover:text-ink"
              href={m.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </div>
          <div className="space-y-2">
            {m.commands.map((c) => (
              <CodeBox key={c} text={c} />
            ))}
          </div>
        </div>
      ))}

      {skill.slug === "karpathy-guidelines" && (
        <p className="mb-5 text-sm text-muted">
          The upstream README uses the original forrestchang/andrej-karpathy-skills name;
          GitHub redirects it to multica-ai/andrej-karpathy-skills.
        </p>
      )}

      {inv && (
        <div className="mb-2">
          <p className="mb-2 text-sm font-medium">
            {skill.install ? "Manual install" : "Install manually"}
          </p>
          <p className="mb-3 text-sm text-muted">
            Put the skill folder in <code>.claude/skills/{inv}/</code> to use it in one
            project, or in <code>~/.claude/skills/{inv}/</code> to use it everywhere. The
            folder must contain <code>SKILL.md</code>.
          </p>
          {skill.origin === "original" ? (
            <>
              <a
                href={`/skills/${skill.slug}/SKILL.md`}
                download
                className="mb-3 inline-block rounded-lg bg-terracotta px-4 py-2 text-sm text-white hover:bg-terracotta-hover"
              >
                Download SKILL.md
              </a>
              <div className="space-y-2">
                <CodeBox
                  text={`mkdir -p ~/.claude/skills/${inv} && curl -fsSL ${rawSkillUrl(skill)} -o ~/.claude/skills/${inv}/SKILL.md`}
                />
                <CodeBox
                  text={`mkdir -p .claude/skills/${inv} && curl -fsSL ${rawSkillUrl(skill)} -o .claude/skills/${inv}/SKILL.md`}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">
              Open the{" "}
              <a
                className="text-terracotta hover:text-terracotta-hover"
                href={src}
                target="_blank"
                rel="noopener noreferrer"
              >
                source folder
              </a>{" "}
              and copy it into one of those locations.
            </p>
          )}
        </div>
      )}

      <H2>When to use</H2>
      <ul className="list-disc space-y-1 pl-5">
        {skill.whenToUse.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>

      <H2>Source</H2>
      <p className="text-sm">
        <a
          className="break-all text-terracotta hover:text-terracotta-hover"
          href={src}
          target="_blank"
          rel="noopener noreferrer"
        >
          {src}
        </a>
      </p>
      <p className="mt-1 text-sm text-muted">
        <a
          className="hover:text-ink"
          href={skillFileUrl(skill)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View SKILL.md on GitHub
        </a>
        {skill.license ? ` · License: ${skill.license}` : ""}
      </p>

      {file && (
        <>
          <H2>Full instructions</H2>
          <div className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 sm:p-6 [&_a]:text-terracotta [&_code]:break-words [&_code]:text-[13px] [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:font-serif [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-medium [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-ivory [&_pre]:p-3 [&_table]:block [&_table]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
              {file.body}
            </ReactMarkdown>
          </div>
        </>
      )}
    </article>
  );
}
