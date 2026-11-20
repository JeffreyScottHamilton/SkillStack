export const SITE = {
  name: "Skill Stacks",
  repo: {
    owner: "JeffreyScottHamilton",
    name: "SkillStack",
    branch: "main",
  },
} as const;

export const repoUrl = `https://github.com/${SITE.repo.owner}/${SITE.repo.name}`;
