<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Commit titles are what the changelog says

Every commit title here is a [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/)
— `feat(hero): …`, `fix: …`, with the types being the keys under `types` in
`changelog.config.json`. `scripts/release` writes `CHANGELOG.md` from those titles with
changelogen, which drops every other shape without a word, so the shape is checked where it is
written: `git config core.hooksPath scripts/hooks` installs the refusing hook, and
`.github/workflows/commits.yml` runs the same check on every pull request.
