export type RepoRef = { owner: string; name: string };

export type InstallMethod = { label: string; commands: string[]; docsUrl: string };

export type Skill = {
  slug: string;
  name: string;
  /** Actual Claude Code skill name, invoked as `/${invocation}`; null if not slash-invocable. */
  invocation: string | null;
  /** Invocation when installed as a plugin, e.g. "plugin-name:skill-name". */
  pluginInvocation?: string;
  summary: string;
  whenToUse: string[];
  exampleArgs?: string;
  tags: string[];
  aliases: string[];
  origin: "original" | "upstream";
  repo: RepoRef;
  path: string;
  branch: string;
  license?: string;
  install?: InstallMethod[];
  hasCompanionFiles: boolean;
};

const OWN_REPO: RepoRef = { owner: "JeffreyScottHamilton", name: "SkillStack" };

export const SKILLS: Skill[] = [
  {
    slug: "caveman",
    name: "Caveman",
    invocation: "caveman",
    summary: "Cut chatter and keep the technical detail.",
    whenToUse: [
      "Long sessions where you want shorter replies and fewer tokens spent.",
      "Quick questions where the explanation matters less than the answer.",
      "Reading terse output faster when you already know the domain.",
    ],
    tags: ["communication", "tokens", "style"],
    aliases: ["cave man", "caveman mode", "terse", "brief"],
    origin: "upstream",
    repo: { owner: "JuliusBrussee", name: "caveman" },
    path: "skills/caveman",
    branch: "main",
    license: "Apache-2.0",
    install: [
      {
        label: "Claude Code plugin (terminal)",
        commands: [
          "claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman",
        ],
        docsUrl: "https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md",
      },
      {
        label: "Inside Claude Code",
        commands: [
          "/plugin marketplace add JuliusBrussee/caveman",
          "/plugin install caveman@caveman",
        ],
        docsUrl: "https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md",
      },
      {
        label: "Skill only (skills CLI)",
        commands: ["npx skills add JuliusBrussee/caveman -g"],
        docsUrl: "https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md",
      },
    ],
    hasCompanionFiles: false,
  },
  {
    slug: "karpathy-guidelines",
    name: "Karpathy Guidelines",
    invocation: "karpathy-guidelines",
    pluginInvocation: "andrej-karpathy-skills:karpathy-guidelines",
    summary: "Keep code changes simple and focused.",
    whenToUse: [
      "Writing or refactoring code where you want the smallest change that works.",
      "Reviewing a patch that feels bigger than the problem it solves.",
      "Keeping edits surgical so unrelated code stays untouched.",
    ],
    tags: ["coding", "review", "refactoring", "guidelines"],
    aliases: ["karpathy", "kaparthy", "andrej karpathy", "simplicity first", "surgical changes"],
    origin: "upstream",
    repo: { owner: "multica-ai", name: "andrej-karpathy-skills" },
    path: "skills/karpathy-guidelines",
    branch: "main",
    license: "MIT",
    install: [
      {
        label: "Inside Claude Code",
        commands: [
          "/plugin marketplace add forrestchang/andrej-karpathy-skills",
          "/plugin install andrej-karpathy-skills@karpathy-skills",
        ],
        docsUrl: "https://github.com/multica-ai/andrej-karpathy-skills#install",
      },
    ],
    hasCompanionFiles: false,
  },
  {
    slug: "review-my-diff",
    name: "Review My Diff",
    invocation: "review-my-diff",
    summary: "Check a patch before opening a pull request.",
    whenToUse: [
      "Before opening a pull request, to catch bugs and leftovers early.",
      "After a long coding session, to confirm the diff only contains what you meant.",
      "When you want a second look for missing tests or stray debug code.",
    ],
    exampleArgs: "main",
    tags: ["git", "review", "pull requests"],
    aliases: ["code review", "diff review", "self review", "pre-pr"],
    origin: "original",
    repo: OWN_REPO,
    path: "skills/review-my-diff",
    branch: "main",
    hasCompanionFiles: false,
  },
  {
    slug: "write-pr-description",
    name: "Write a PR Description",
    invocation: "write-pr-description",
    summary: "Turn the current branch into a clear pull request description.",
    whenToUse: [
      "Your branch is ready and the pull request body is still empty.",
      "You want reviewers to see what changed and why, without rereading the diff.",
      "Summarizing many small commits into one coherent description.",
    ],
    exampleArgs: "main",
    tags: ["git", "pull requests", "writing"],
    aliases: ["pr description", "pull request", "pr body"],
    origin: "original",
    repo: OWN_REPO,
    path: "skills/write-pr-description",
    branch: "main",
    hasCompanionFiles: false,
  },
  {
    slug: "draft-release-notes",
    name: "Draft Release Notes",
    invocation: "draft-release-notes",
    summary: "Summarize changes since the last tag into user-facing release notes.",
    whenToUse: [
      "Cutting a release and needing a readable summary of what shipped.",
      "Turning commit history into notes users can scan quickly.",
      "Preparing a changelog entry from a specific tag.",
    ],
    exampleArgs: "v1.2.0",
    tags: ["git", "releases", "writing"],
    aliases: ["changelog", "release notes", "what's new"],
    origin: "original",
    repo: OWN_REPO,
    path: "skills/draft-release-notes",
    branch: "main",
    hasCompanionFiles: false,
  },
];

export function getSkill(slug: string): Skill | undefined {
  return SKILLS.find((s) => s.slug === slug);
}

export function repoKey(repo: RepoRef): string {
  return `${repo.owner}/${repo.name}`.toLowerCase();
}

export function sourceUrl(s: Skill): string {
  return `https://github.com/${s.repo.owner}/${s.repo.name}/tree/${s.branch}/${s.path}`;
}

export function skillFileUrl(s: Skill): string {
  return `https://github.com/${s.repo.owner}/${s.repo.name}/blob/${s.branch}/${s.path}/SKILL.md`;
}

export function rawSkillUrl(s: Skill): string {
  return `https://raw.githubusercontent.com/${s.repo.owner}/${s.repo.name}/${s.branch}/${s.path}/SKILL.md`;
}
