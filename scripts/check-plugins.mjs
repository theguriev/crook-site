#!/usr/bin/env node
// Says where src/data/plugins.ts and the registry's index.json disagree.
//
// The page is a hand-kept copy of the index, and a copy drifts: a release
// that asks for one more thing leaves the site telling people the old list.
// What a plugin asks for is the one thing on the page somebody decides on, so
// it is compared word for word; the version and the commit behind each
// release are compared with it. Everything else on the page (blurbs, where it
// draws, keywords) is the site's own writing and is left alone.
//
//   node scripts/check-plugins.mjs              # fetches the live index
//   node scripts/check-plugins.mjs index.json   # or reads a saved one
//
// Exits 1 on any difference, listing each.

import { readFile } from "node:fs/promises";
import { INDEX_URL, PLUGINS, pluginId } from "../src/data/plugins.ts";

const source = process.argv[2];
const index = source
  ? JSON.parse(await readFile(source, "utf8"))
  : await (await fetch(INDEX_URL)).json();

const problems = [];
const listed = new Map(index.plugins.map((entry) => [entry.id, entry]));

for (const plugin of PLUGINS) {
  const id = pluginId(plugin);
  const entry = listed.get(id);
  listed.delete(id);
  if (!entry) {
    problems.push(`${id}: on the page, not in the index`);
    continue;
  }

  const versions = entry.versions.filter((v) => !v.yanked);
  const newest = versions.at(-1);
  if (plugin.version !== newest.version) {
    problems.push(`${id}: the page says ${plugin.version}, the index's newest is ${newest.version}`);
  }

  const asks = plugin.asks.map((a) => a.text);
  if (JSON.stringify(asks) !== JSON.stringify(newest.asks)) {
    problems.push(
      `${id}: asks differ\n    page:  ${JSON.stringify(asks)}\n    index: ${JSON.stringify(newest.asks)}`,
    );
  }

  const refs = new Map(versions.map((v) => [v.version, v.ref]));
  for (const release of plugin.releases) {
    const ref = refs.get(release.version);
    if (ref !== release.ref) {
      problems.push(`${id} ${release.version}: the page names ${release.ref}, the index ${ref ?? "no such version"}`);
    }
  }
}

for (const id of listed.keys()) problems.push(`${id}: in the index, not on the page`);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${PLUGINS.length} plugins match the index`);
