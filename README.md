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
| `src/data/plugins.ts` | The six plugins: description, permissions, previews, releases. Swap for `index.json` when the site should read the live registry. |
| `src/data/site.ts` | Version, URLs, the install command. |
| `src/app/globals.css` | The palette as shadcn tokens plus Crook's own (`yolk`, `frame`, status and tag colours), light and dark. |
| `src/components/site-header.tsx` | Nav with theme toggle and the mobile menu. |
| `public/images`, `public/plugins` | Screenshots and plugin icons/previews, copied from the sibling repositories. |

Fonts come from `next/font/google`: Familjen Grotesk for headings, IBM Plex Sans for text, JetBrains Mono for code and the hero.
