import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/hero";
import { AgentStatusDrawing, PirateChipDrawing } from "@/components/landing/drawings";
import { Bullets, Container, Eyebrow, FactsStrip, Feature, Legend, PluginTile, Shot } from "@/components/landing/sections";
import { CopyCommand } from "@/components/copy-command";
import { Button } from "@/components/ui/button";
import { PLUGINS } from "@/data/plugins";
import { ARCHITECTURE_URL, INSTALL_COMMAND, RELEASES_URL, REPO_URL } from "@/data/site";

import tabs from "../../public/images/tabs.png";
import blocks from "../../public/images/blocks.png";
import find from "../../public/images/find.png";
import palette from "../../public/images/palette.png";
import pluginsShot from "../../public/images/plugins.png";

const NAV = [
  { href: "#agent", label: "Agents" },
  { href: "#blocks", label: "Blocks" },
  { href: "#palette", label: "Palette" },
  { href: "/plugins", label: "Plugins" },
  { href: ARCHITECTURE_URL, label: "Architecture" },
  { href: REPO_URL, label: "GitHub" },
];

const PLUGIN_BLURBS: Record<string, string> = {
  pirate: "Claude Code budget, and when it resets",
  chips: "Directory, branch, and what a chord does",
  markdown: "A block as Markdown, ready to paste",
  dziling: "A short sound when something finishes",
  emoji: "An emoji per tab, asking for nothing",
  worktree: "A mark on every worktree tab",
};

const SHELL_FACTS: [string, React.ReactNode][] = [
  ["A real pty, a real emulator", <>xterm-compatible: colour, bold, italic, underline, strikeout, the alternate screen, ten thousand lines of scrollback, <code>SIGWINCH</code> on resize.</>],
  ["Panes and splits", <><kbd>cmd</kbd>+<kbd>d</kbd> and <kbd>cmd</kbd>+<kbd>shift</kbd>+<kbd>d</kbd>. A shell that exits closes its pane, its tab, and with the last tab the window.</>],
  ["Tabs that name themselves", <>OSC 0, 2 and 7: what you called it, else what the agent calls its work, else what it is running, else the directory it sits in.</>],
  ["The header is the title bar", <>No strip of system chrome. Drag its empty space to move the window; macOS keeps its traffic lights exactly where every Mac app has them.</>],
  ["Groups and worktrees", <>A worktree opened from a tab folds the two into a group with a count. Drag a row in, past the edge to take it out.</>],
  ["Pictures that are the same everywhere", <><code>--snapshot</code> renders one frame of the real view tree to a PNG. Every screenshot on this page was made that way.</>],
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader
        mono
        links={NAV}
        menuOnly={[{ href: "#install", label: "Install" }]}
        action={
          <Button render={<a href="#install" />} className="h-9 rounded-[3px] px-4 font-mono text-[15px] font-semibold">
            Install
          </Button>
        }
      />

      <main>
        <Hero />
        <FactsStrip />

        <Feature
          id="agent"
          eyebrow={<Eyebrow accent="crook --agent"> running · needs-input · failed · idle</Eyebrow>}
          title="The agent reports its own status."
          aside={
            <div className="grid gap-4.5">
              <div className="grid gap-3.5 md:max-w-[380px]">
                <Shot
                  src={tabs}
                  alt="The tab panel: four agent sessions with a coloured status dot and the branch each is on, two of them folded into a group"
                />
                <Legend />
                <p className="text-[13.5px] text-muted-foreground">
                  The panel as Crook renders it: one row per agent, the branch under the title, two related tabs folded into a group.
                </p>
              </div>
              <AgentStatusDrawing />
              <p className="text-[13.5px] text-muted-foreground">Drawn, not captured: the header chip, three rows, and the hook lines behind them.</p>
            </div>
          }
        >
          <p>
            The program in the pane writes one escape sequence to its own terminal and exits. No socket, no pane id: the terminal it has is the
            pane. That is why it works from a hook, over <code>ssh</code> and inside a container, and why every other terminal drops it unread.
          </p>
          <Bullets
            items={[
              <><code>crook --agent-hooks claude</code> prints the hooks that make Claude Code say all of it by itself.</>,
              <>A row waiting on you is washed amber. The header counts them, and <kbd>cmd</kbd>+<kbd>j</kbd> goes to the next one.</>,
              <>The window title carries the count, so a switcher tells three Crooks apart and says which one stopped for you.</>,
            ]}
          />
        </Feature>

        <Feature
          id="blocks"
          flip
          eyebrow={<Eyebrow accent="blocks"> · one command, its output, a boundary</Eyebrow>}
          title="Output is a list of commands, not one scrolling screen."
          aside={
            <Shot
              src={blocks}
              alt="Three finished commands, each in its own block with a rule between them, the last one showing the copy and menu controls under the pointer"
              caption="Three finished commands. The pointer over the third brings up copy and menu in its corner; the open block under the prompt carries the accent stripe."
            />
          }
        >
          <p>
            Each command is a block holding its prompt, the line that was run and everything it printed. A failed one gets a red wash; the one
            still running gets the stripe.
          </p>
          <Bullets
            items={[
              <>Hover copies exactly that command and its output. No neighbour&rsquo;s text, no trailing blank rows.</>,
              <>Ten thousand commands survive a <code>clear</code>, a resize and the emulator&rsquo;s own history evicting anything.</>,
              <>Blocks are what find, the palette and the markdown plugin work on.</>,
            ]}
          />
        </Feature>

        <Feature
          id="find"
          eyebrow={<Eyebrow accent="cmd-f"> · ctrl-shift-f off macOS</Eyebrow>}
          title="Find searches every block at once."
          aside={
            <Shot
              src={find}
              alt="The find bar over a pane, reading tab, counting three matches and highlighting them in the output"
              caption="“tab”, 1 of 3, highlighted where the matches are."
            />
          }
        >
          <p>
            Every finished command and the open one, counted in the bar. The current match is in the accent, the rest in amber. It is a search
            and not a filter, so the lines between the hits stay where they are.
          </p>
        </Feature>

        <Feature
          id="palette"
          flip
          eyebrow={
            <Eyebrow accent="cmd-k">
              {" "}· <code>&gt;</code> commands · <code>@</code> tabs · <code>#</code> settings · <code>?</code> keys
            </Eyebrow>
          }
          title="One box for everything that has a name."
          aside={
            <Shot
              src={palette}
              alt="The command palette reading rec: two commands, one tab with its directory, and five settings rows naming the page each lives on"
              caption="“rec”: commands, one tab with the directory it is working in, and settings rows that name their page."
            />
          }
        >
          <p>
            Commands, open tabs and every settings row, each kind under its own heading when there is more than one kind of answer. A command
            row prints its chord; a tab row says where it is working; a settings row opens its page with the row on screen.
          </p>
          <Bullets
            items={[
              <>A sigil narrows the list to one kind, and <kbd>tab</kbd> walks between them.</>,
              <><code>?</code> answers &ldquo;what is bound to what&rdquo; from the same box.</>,
            ]}
          />
        </Feature>

        <Feature
          id="plugins"
          eyebrow={<Eyebrow accent="plugins"> · sandboxed .wasm · installing is not allowing</Eyebrow>}
          title="A plugin describes what it wants drawn. The host paints it."
          aside={
            <div className="grid gap-4.5">
              <Shot
                src={pluginsShot}
                alt="The Plugins page: the Pirate's card with the two things it asks to be allowed, an Allow button beside them, and the pictures it carries under What it looks like"
                caption="The Pirate's card: two sentences it asks for, one button, and the pictures it carries inside its module."
              />
              <PirateChipDrawing />
              <p className="text-[13.5px] text-muted-foreground">
                What the pirate draws in the header: the host&rsquo;s own artwork by name, and one number it asked permission to read.
              </p>
            </div>
          }
        >
          <p>
            A module runs in an interpreter with no filesystem, no network and no clock of its own. It names a badge, a meter, a chip, a
            panel; Crook draws them in the theme, so a plugin names no colour and no pixel. Anything from the machine it has to ask for, in
            sentences, and the card is where they are answered.
          </p>
          <Bullets
            items={[
              <>The Store fetches one static <code>index.json</code>. No account, no machine id, nothing about what you have installed.</>,
              <>Every artifact in the registry is built from source by CI and hashed. Previews live inside the module.</>,
              <><code>crook --dev-plugin .</code> runs the one you are writing straight out of <code>target/</code>, and again on every build.</>,
            ]}
          />
          <div className="mt-5.5 grid gap-2.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {PLUGINS.map((p) => (
              <PluginTile key={p.name} name={p.name} blurb={PLUGIN_BLURBS[p.name]} href={`/plugins#${p.owner}/${p.name}`} />
            ))}
          </div>
          <div className="mt-4.5">
            <Button variant="outline" size="lg" render={<Link href="/plugins" />}>
              Browse the registry
            </Button>
          </div>
        </Feature>

        <section className="border-b border-border py-14 sm:py-18">
          <Container>
            <Eyebrow accent="and underneath"> · a real shell in every pane</Eyebrow>
            <h2 className="mt-2.5 mb-7 text-[26px] font-bold sm:text-[30px]">The parts a terminal has to get right anyway.</h2>
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {SHELL_FACTS.map(([k, v]) => (
                <div key={k} className="bg-card px-5.5 py-5">
                  <div className="mb-1.5 font-heading text-lg font-semibold">{k}</div>
                  <p className="text-[15px] text-ink-2">{v}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section id="install" className="scroll-mt-16 pt-14 pb-6 sm:pt-21">
          <Container>
            <Eyebrow accent="install"> · one binary, nothing else on the machine</Eyebrow>
            <h2 className="mt-2.5 mb-2 text-[26px] font-bold sm:text-[34px]">Get Crook</h2>
            <p className="mb-7.5 max-w-[60ch] text-ink-2">
              The script reads the latest release, checks the archive against the <code>SHA256SUMS</code> published beside it, and puts the
              binary in <code>~/.local/bin</code>.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Platform title="macOS" meta="Apple Silicon and Intel · one universal .app">
                <p>Signed, notarized and stapled. Opens on a double click with no dialog and no network. Drag it to Applications.</p>
                <Button size="lg" render={<Link href={RELEASES_URL} />}>
                  Download the .dmg
                </Button>
              </Platform>
              <Platform title="Linux" meta="x86_64 · frameless under Wayland and X11">
                <p>
                  The install script, or the <code>.tar.gz</code> with the bare binary from the releases page.
                </p>
                <CopyCommand command={INSTALL_COMMAND} wrap className="py-2.75 pr-3 pl-3.5 text-[13px]" />
              </Platform>
              <Platform title="Windows" meta="x86_64 · .zip">
                <p>The frameless window and shell integration are built for it and not yet run on it. The architecture notes say what was checked instead.</p>
                <Button variant="outline" size="lg" render={<Link href={RELEASES_URL} />}>
                  Download the .zip
                </Button>
              </Platform>
            </div>
            <p className="mt-6.5 max-w-[70ch] text-[14.5px] text-muted-foreground [&_code]:rounded bg-transparent [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-px">
              Building it yourself is <code>cargo build --release</code> with a stable Rust toolchain and no build scripts. <code>script/run</code>{" "}
              starts it from the checkout; <code>--snapshot</code> draws a frame to a PNG without opening a window.
            </p>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Platform({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5.5 [&>p]:mb-4 [&>p]:text-[15px] [&>p]:text-ink-2">
      <h3 className="mb-1 text-[19px] font-semibold">{title}</h3>
      <div className="mb-3.5 font-mono text-[12.5px] text-muted-foreground">{meta}</div>
      {children}
    </div>
  );
}
