# crook-site

The website for [Crook](https://github.com/theguriev/crook): the landing page and the plugin registry browser.

Next.js (App Router), Tailwind CSS v4, shadcn/ui on Base UI, `next-themes` for light and dark.

```sh
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Pages

- `/` — the landing. The first section is a canvas pixel field with the pirate mark and wordmark snapping together on load
  (`src/components/landing/pixel-field.tsx`); the rest are Crook's own `--snapshot` renders from `crook/docs/images`.
- `/plugins` — the registry. Search, filters by what a plugin asks for and where it draws, a sheet per plugin
  (`#owner/name` in the URL opens it), and an "Add a plugin" dialog that writes a checked `plugin.toml` and opens the
  GitHub new-file editor for a pull request.

## Where things live

| Path | What |
| --- | --- |
| `src/data/plugins.ts` | The six plugins: description, permissions, previews, releases. A hand-kept copy of the registry's `index.json`: after a plugin release, `npm run check:plugins` says where the permissions, versions or release commits no longer match it. Swap for `index.json` when the site should read the live registry. |
| `src/data/site.ts` | Version, URLs, the install command. |
| `src/app/globals.css` | The palette as shadcn tokens plus Crook's own (`yolk`, `frame`, status and tag colours), light and dark. |
| `src/components/site-header.tsx` | Nav with theme toggle and the mobile menu. |
| `public/images`, `public/plugins` | Screenshots and plugin icons/previews, copied from the sibling repositories. |

Fonts come from `next/font/google`: Familjen Grotesk for headings, IBM Plex Sans for text, JetBrains Mono for code and the hero.

## Deploy

The site runs on blls.me next to the other projects there, behind the shared
`nginx-proxy` + `acme-companion` that owns ports 80 and 443. The container
publishes no port: it joins the external `edge` network and names its domain in
`VIRTUAL_HOST` / `LETSENCRYPT_HOST`, and the proxy routes to it and issues the
Let's Encrypt certificate. Everything lives under its own compose project
(`crook`) in `/opt/crook-site`, so it cannot reach the neighbours.

```sh
scripts/deploy.sh            # rsync the checkout, docker build on the server, compose up, wait for /healthz
scripts/deploy.sh --status   # what is running
scripts/deploy.sh --logs     # deploy, then follow the logs
```

The script refuses to deploy while `crook.id` and `www.crook.id` do not resolve
to the server, because the certificate would fail; `FORCE=1` overrides that.
`HOST`, `DOMAIN`, `REMOTE_DIR` and `ACME_EMAIL` can be set in the environment.

Pieces: `Dockerfile` (three stages, standalone Next server, non-root, health
check on `/healthz`), `docker-compose.prod.yml` (the service and the proxy
wiring), `src/app/healthz/route.ts`, and the `www` → apex redirect in
`next.config.ts`.

To roll back by hand on the server: every build is also tagged
`crook-site:<short sha>`, so `docker tag crook-site:<sha> crook-site:latest`
followed by `docker compose -f docker-compose.prod.yml up -d` in
`/opt/crook-site/src` brings that one back.

## Releasing

A tag here publishes nothing — the site goes out when somebody runs `scripts/deploy.sh` — but
it says which version of the site that is:

```sh
scripts/release 0.2.0 --push
```

It sets `version` in `package.json`, writes the `## v0.2.0` section of `CHANGELOG.md` from the
commit titles since the previous tag with [changelogen](https://github.com/unjs/changelogen),
commits both as `chore(release): v0.2.0`, tags it and pushes.

Which makes commit titles the changelog, so they are [Conventional
Commits](https://www.conventionalcommits.org/en/v1.0.0/) — `feat(hero): …`, `fix: …`, the types
listed under `types` in `changelog.config.json`. A title in any other shape is dropped by the
generator without a word, so it is refused where it is still easy to fix: `git config
core.hooksPath scripts/hooks` installs the hook, and `commits.yml` runs the same check on every
pull request. The history before this predates the convention, so the first release over it
needs `--allow-untyped`.
