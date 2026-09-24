export type AskKind = "files" | "net" | "shell" | "misc";
export type AskFilter = AskKind | "none";
export type Where = "header" | "tabs" | "prompt" | "menu";

export type Ask = { kind: AskKind; text: string };
export type Preview = { src: string; width: number; height: number; caption: string };
export type Release = { version: string; ref: string };

export type Plugin = {
  name: string;
  owner: string;
  version: string;
  repo: string;
  blurb: string;
  where: Where[];
  whereText: string;
  asks: Ask[];
  keywords: string;
  previews: Preview[];
  releases: Release[];
};

export const ASK_LABEL: Record<AskFilter, string> = {
  none: "asks for nothing",
  files: "files",
  net: "network",
  shell: "types commands",
  misc: "other",
};

export const ASK_FILTER_LABEL: Record<AskFilter, string> = {
  none: "nothing",
  files: "files or directories",
  net: "the network",
  shell: "to type into your shell",
  misc: "clipboard, blocks, sound",
};

export const WHERE_LABEL: Record<Where, string> = {
  header: "header",
  tabs: "tab rows",
  prompt: "under the prompt",
  menu: "block menu",
};

export const WHERE_FILTER_LABEL: Record<Where, string> = {
  header: "the header",
  tabs: "tab rows",
  prompt: "under the prompt",
  menu: "a block's menu",
};

export const INDEX_URL =
  "https://github.com/theguriev/crook-plugins/releases/download/index/index.json";
export const INDEX_BUILT = "2026-09-22";
export const ABI = 8;

export function pluginId(p: Plugin) {
  return `${p.owner}/${p.name}`;
}

export function iconSrc(p: Plugin) {
  return `/plugins/${p.name}/icon.png`;
}

export function askKinds(p: Plugin): AskFilter[] {
  const kinds = Array.from(new Set(p.asks.map((a) => a.kind)));
  return kinds.length ? kinds : ["none"];
}

export const PLUGINS: Plugin[] = [
  {
    name: "pirate",
    owner: "theguriev",
    version: "0.3.1",
    repo: "https://github.com/theguriev/crook-pirate",
    blurb: "How much of the Claude Code session budget is spent, and when it resets.",
    where: ["header"],
    whereText: "the header, and a panel under it",
    asks: [
      { kind: "files", text: "Read ~/.claude/.credentials.json, everything under ~/.claude/projects" },
      { kind: "net", text: "Reach api.anthropic.com" },
    ],
    keywords:
      "claude code usage budget tokens quota session week reset anthropic api credentials chip meter percentage",
    previews: [
      {
        src: "/plugins/pirate/chip.png",
        width: 640,
        height: 128,
        caption:
          "The pirate and the session percentage at the right-hand end of the header. The bite is animated by naming a different frame of the host's own artwork.",
      },
      {
        src: "/plugins/pirate/panel.png",
        width: 560,
        height: 1010,
        caption: "The panel hung under the chip: session and week, each with a meter and when it resets.",
      },
    ],
    releases: [
      { version: "0.3.1", ref: "9740ab3fca01f2ef3ac091f20b07facb81ed8001" },
      { version: "0.3.0", ref: "844ace5e46133f4097eb6ff2ae75eb2f60ebc40b" },
    ],
  },
  {
    name: "chips",
    owner: "theguriev",
    version: "0.2.1",
    repo: "https://github.com/theguriev/crook-chips",
    blurb:
      "Where the pane is, what branch it is on, and what one chord would do. Pick a directory or a branch and it types the command for you.",
    where: ["prompt"],
    whereText: "the row under the line you are typing",
    asks: [
      { kind: "files", text: "See which project each tab is in" },
      { kind: "files", text: "See the names of the files in ~" },
      { kind: "shell", text: "Type into your shell, and run: cd …, git switch …" },
      { kind: "misc", text: "See what Crook can be asked to do, and the keys for it" },
      { kind: "misc", text: "Use Crook's own crook/window/new-tab, crook/shortcuts/rebind" },
    ],
    keywords: "cwd directory branch git switch cd picker chord shortcut keyboard row prompt status line",
    previews: [
      {
        src: "/plugins/chips/chips.png",
        width: 900,
        height: 300,
        caption:
          "The row of chips under the line being typed: directory, branch, and the chord that opens a new agent tab.",
      },
      {
        src: "/plugins/chips/directories.png",
        width: 900,
        height: 620,
        caption:
          "The directory picker. The field, the filtering and the arrow keys belong to Crook; the plugin only says what can be chosen.",
      },
      {
        src: "/plugins/chips/branches.png",
        width: 1000,
        height: 680,
        caption: "The branch picker. Choosing a row types git switch, quoted by the host, and only ever that.",
      },
    ],
    releases: [
      { version: "0.2.1", ref: "48a6ecb9d4b69e9317f86cc59a504d49cdba0c05" },
      { version: "0.2.0", ref: "cbc686791fbf61631ea693596443b72ed8bf20d9" },
    ],
  },
  {
    name: "markdown",
    owner: "theguriev",
    version: "0.2.1",
    repo: "https://github.com/theguriev/crook-markdown",
    blurb: "A command and its output, as Markdown ready to paste into an issue, a message or a pull request.",
    where: ["menu"],
    whereText: "the menu on every finished block",
    asks: [
      { kind: "misc", text: "Read the command you run it on, and what it printed" },
      { kind: "files", text: "See which project each tab is in" },
      { kind: "misc", text: "Read and change your clipboard" },
    ],
    keywords: "copy paste markdown fenced code block output share issue github slack export",
    previews: [],
    releases: [
      { version: "0.2.1", ref: "f33bded0256aec586f25116efb4c64ca511ade76" },
      { version: "0.2.0", ref: "866ea70c6ca3cd7413283670d02192318f5ceaa6" },
    ],
  },
  {
    name: "dziling",
    owner: "theguriev",
    version: "0.1.1",
    repo: "https://github.com/theguriev/crook-dziling",
    blurb:
      "Rings a short sound when a command finishes or a bell rings. Six sounds to choose from, none of them long.",
    where: [],
    whereText: "nowhere: it only makes a sound, and has a settings page to pick it",
    asks: [
      { kind: "misc", text: "Know when a command finishes" },
      { kind: "misc", text: "Know when a program asks for your attention" },
      { kind: "misc", text: "Play a sound" },
    ],
    keywords:
      "sound notification bell finished done chime ding audio alert dzin microwave engine coin sonar typewriter",
    previews: [],
    releases: [
      { version: "0.1.1", ref: "a65c36a22e5bee597325e39e5f3e67f081bbb634" },
      { version: "0.1.0", ref: "f29ff89361d42f9a6a25dc25d117884edb3bad0c" },
    ],
  },
  {
    name: "emoji",
    owner: "theguriev",
    version: "0.1.1",
    repo: "https://github.com/theguriev/crook-emoji",
    blurb:
      "An emoji at the head of every tab, instead of the status dot. The same one for a tab every day, a different one for the tab beside it.",
    where: ["tabs"],
    whereText: "the mark at the head of every tab row",
    asks: [],
    keywords: "emoji tab icon mark avatar identify picture fun status dot row panel sidebar",
    previews: [
      {
        src: "/plugins/emoji/marks.png",
        width: 500,
        height: 640,
        caption: "An emoji where the status dot was. The plugin is handed one number per row and nothing else.",
      },
      {
        src: "/plugins/emoji/beside-a-badge.png",
        width: 680,
        height: 240,
        caption: "Beside a corner badge from another plugin: the two slots on a row are separate.",
      },
    ],
    releases: [
      { version: "0.1.1", ref: "dffc403a216f7d632c4c522d149d484cd0910f8e" },
      { version: "0.1.0", ref: "2cfea8175148dd7229941ee40619c607b1b5e8e0" },
    ],
  },
  {
    name: "worktree",
    owner: "theguriev",
    version: "0.1.1",
    repo: "https://github.com/theguriev/crook-worktree",
    blurb: "A mark on the corner of every tab whose directory is a linked git worktree.",
    where: ["tabs"],
    whereText: "the badge on the corner of a tab row",
    asks: [{ kind: "files", text: "See which project each tab is in" }],
    keywords: "git worktree branch checkout badge tab row mark corner linked",
    previews: [
      {
        src: "/plugins/worktree/rows.png",
        width: 500,
        height: 640,
        caption: "Two tabs in worktrees carry the mark; the one on the main checkout does not.",
      },
      {
        src: "/plugins/worktree/badge.png",
        width: 680,
        height: 240,
        caption: "The badge up close, beside the status dot it does not replace.",
      },
    ],
    releases: [
      { version: "0.1.1", ref: "f8de23375f3eba980d548d3b60d1eefa74332f53" },
      { version: "0.1.0", ref: "8c3b138581dc59b19cd0cdfa6497bd3e2d54042f" },
    ],
  },
];
