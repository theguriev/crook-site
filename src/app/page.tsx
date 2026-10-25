import Link from "next/link";
import { ViewedHomePage } from "@/components/analytics";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/hero";
import { AgentStatusDrawing, PirateChipDrawing } from "@/components/landing/drawings";
import { Bullets, Chapter, Container, Eyebrow, Glass, Legend, PluginTile, Shot } from "@/components/landing/sections";
import { ChapterRail, WorldCanvas } from "@/components/landing/world-canvas";
import { CopyCommand } from "@/components/copy-command";
import { Button } from "@/components/ui/button";
import { PLUGINS } from "@/data/plugins";
import { ARCHITECTURE_URL, DMG_URL, INSTALL_DESKTOP_COMMAND, REPO_URL, WINDOWS_ZIP_URL } from "@/data/site";

import tabs from "../../public/images/tabs.png";
import blocks from "../../public/images/blocks.png";
import find from "../../public/images/find.png";
import palette from "../../public/images/palette.png";
import pluginsShot from "../../public/images/plugins.png";
import answerCard from "../../public/images/answer-card.png";
import answerList from "../../public/images/answer-list.png";

const NAV = [
  { href: "#agent", label: "Agents" },
  { href: "#answer", label: "Answering" },
  { href: "#blocks", label: "Blocks" },
  { href: "#palette", label: "Palette" },
  { href: "/plugins", label: "Plugins" },
  { href: ARCHITECTURE_URL, label: "Architecture" },
  { href: REPO_URL, label: "GitHub" },
];

const CHAPTERS = [
  { id: "top", label: "harbour" },
  { id: "agent", label: "agents" },
  { id: "answer", label: "answer" },
  { id: "blocks", label: "blocks" },
  { id: "find", label: "find" },
  { id: "palette", label: "palette" },
  { id: "plugins", label: "plugins" },
  { id: "shell", label: "shell" },
  { id: "install", label: "install" },
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
  ["Panes and splits", <><kbd>cmd</kbd>+<kbd>d</kbd> splits the focused pane right, <kbd>cmd</kbd>+<kbd>shift</kbd>+<kbd>d</kbd> down, so right then down is an agent beside two watchers and the same again is a 2×2. Every divider drags, at every depth.</>],
  ["Tabs that name themselves", <>OSC 0, 2 and 7: what you called it, else what the agent calls its work, else what it is running, else the directory it sits in.</>],
  ["The header is the title bar", <>No strip of system chrome. Drag its empty space to move the window; macOS keeps its traffic lights exactly where every Mac app has them.</>],
  ["Groups and worktrees", <>A worktree opened from a tab folds the two into a group with a count. Drag a row in, past the edge to take it out.</>],
  ["Pictures that are the same everywhere", <><code>--snapshot</code> renders one frame of the real view tree to a PNG. Every screenshot on this page was made that way.</>],
];

export default function LandingPage() {
  return (
    <div className="dark landing">
      <ViewedHomePage />
      <WorldCanvas />
      <ChapterRail chapters={CHAPTERS} />
      <SiteHeader
        overlay
        mono
        links={NAV}
        menuOnly={[{ href: "#install", label: "Install" }]}
        action={
          <Button nativeButton={false} render={<a href="#install" />} className="h-9 rounded-[3px] px-4 font-mono text-[15px] font-semibold">
            Install
          </Button>
        }
      />

      <main className="relative z-10">
        <Hero />

        <Chapter
          index={1}
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
              <>Crook&rsquo;s plugin makes Claude Code say all of it by itself: <code>claude plugin marketplace add theguriev/crook</code>, then <code>claude plugin install crook@crook</code>. Codex and Copilot CLI take the same plugin; <code>crook --agent-hooks</code> prints the hooks to merge by hand.</>,
              <>With no hooks at all, Claude Code&rsquo;s own title still says running and idle.</>,
              <>A row waiting on you is washed amber. The header counts them, and <kbd>cmd</kbd>+<kbd>j</kbd> goes to the next one.</>,
              <>The window title carries the count, so a switcher tells three Crooks apart and says which one stopped for you. Behind another window, a pane that turns amber posts a desktop notification on Linux and from Crook.app on macOS, where the dock carries the count.</>,
            ]}
          />
        </Chapter>

        <Chapter
          index={2}
          id="answer"
          eyebrow={<Eyebrow accent="cmd-i"> · ctrl-shift-i off macOS · Claude Code</Eyebrow>}
          title="Answer the agent from the tab you are in."
          aside={
            <div className="grid gap-4.5">
              <Shot
                src={answerCard}
                alt="The card: Claude Code wants to run a command, the tab and directory, the whole command, what Claude Code says it is for, that it is asking in its tab too, and the buttons Allow once, Deny, Go to tab and Not now, with Not now filled"
                caption="The card, a moment after it opened: Allow once is still greyed, and Not now is the default."
              />
              <Shot
                src={answerList}
                alt="The list of three requests waiting, oldest first, each naming the agent, the tab, how long ago and the command, with an Earlier section under them saying how three earlier requests ended"
                caption="Three waiting: rows open a card and answer nothing. Earlier says how the last ones ended."
              />
            </div>
          }
        >
          <p>
            The moment Claude Code stops to ask, its row turns amber with the command on its second line, and the header says how many are
            waiting to be answered. One card holds the whole command, the tab and directory it runs in, and four buttons: Allow once, Deny,
            Go to tab, and Not now, which is the default.
          </p>
          <Bullets
            items={[
              <>Allow, Deny and Go to tab wait for a second of stillness before a key or a press reaches them. There is no &ldquo;always allow&rdquo;.</>,
              <>An Edit, MultiEdit or Write request is drawn as the change, in a diff&rsquo;s colours.</>,
              <>The command is drawn the way the shell will read it: left to right, with lookalikes, blank-looking characters and stray marks written out. A request with any text that is not ASCII is allowed only after it has been read as written, every such character spelled out as its code point.</>,
              <>Claude Code&rsquo;s own dialog stays up in its tab, and whichever is answered first wins. Inside tmux the card finds the Crook pane holding tmux&rsquo;s client.</>,
              <>With more than one waiting, the chord opens the list, oldest first. <em>Let agents ask in Crook</em>, on the Appearance page, turns answering off.</>,
            ]}
          />
        </Chapter>

        <Chapter
          index={3}
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
              <>An agent&rsquo;s whole session is one open block. Past its newest 500 lines or so it is kept as rows rather than grid cells: 6.3 MiB for ten thousand rows at 200 columns, where it was 46.9.</>,
              <>Blocks are what find, the palette and the markdown plugin work on.</>,
            ]}
          />
        </Chapter>

        <Chapter
          index={4}
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
          <Bullets
            items={[
              <><code>Aa</code> tells capitals apart, and <code>.*</code> reads the query as a regular expression.</>,
              <>The filter is a block&rsquo;s own: <em>Filter output</em> on its menu shows the command and only the lines that match.</>,
              <>A pane with no blocks, an agent or an <code>ssh</code> session, is searched through its whole scrollback.</>,
            ]}
          />
        </Chapter>

        <Chapter
          index={5}
          id="palette"
          flip
          eyebrow={
            <Eyebrow accent="shift-cmd-p">
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
              <>A settings row chosen here lands the keyboard on it. Settings, Plugins, the Store and the Changes column are walked by keyboard too: <kbd>tab</kbd> through every control, <kbd>enter</kbd> to press, <kbd>esc</kbd> back out.</>,
            ]}
          />
        </Chapter>

        <Chapter
          index={6}
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
            <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/plugins" />}>
              Browse the registry
            </Button>
          </div>
        </Chapter>

        <section id="shell" data-station className="relative flex min-h-svh flex-col justify-center py-[14vh]">
          <Container>
            <div className="mx-auto mb-10 max-w-[760px] text-center">
              <Eyebrow accent="and underneath"> · a real shell in every pane</Eyebrow>
              <h2 className="mt-3 font-heading text-[32px] leading-[1.02] font-bold tracking-[-0.02em] uppercase sm:text-[48px]">
                The parts a terminal has to get right anyway.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SHELL_FACTS.map(([k, v]) => (
                <Glass key={k} className="px-5.5 py-5">
                  <div className="mb-1.5 font-heading text-lg font-semibold">{k}</div>
                  <p className="text-[15px] text-ink-2">{v}</p>
                </Glass>
              ))}
            </div>
          </Container>
        </section>

        <section id="install" data-station className="relative flex min-h-svh flex-col justify-end pt-[30vh] pb-16">
          <Container>
            <Eyebrow accent="install"> · one binary, checked against the sums beside it</Eyebrow>
            <h2 className="mt-3 mb-3 font-heading text-[40px] leading-none font-bold tracking-[-0.02em] uppercase sm:text-[64px]">Get Crook</h2>
            <p className="mb-7.5 max-w-[60ch] text-ink-2">
              The script reads the latest release, checks the archive against the <code>SHA256SUMS</code> published beside it, and puts the
              binary in <code>~/.local/bin</code>.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Platform title="macOS" meta="Apple Silicon and Intel · one universal .app">
                <p>
                  The image and the app are each signed, notarized and stapled, so the image opens with no warning. Drag Crook to
                  Applications; its first launch asks once to confirm a download, and Open starts it.
                </p>
                <p>Take the app rather than the bare binary: notifications, the dock&rsquo;s badge and Default terminal need it.</p>
                <Button size="lg" nativeButton={false} render={<a href={DMG_URL} />}>
                  Download the .dmg
                </Button>
              </Platform>
              <Platform title="Linux" meta="x86_64 · glibc 2.31+ · Wayland and X11">
                <p>
                  Debian 11, Ubuntu 20.04, RHEL 9 and anything since. <code>--desktop</code> also installs the desktop entry and icons that
                  put Crook in the application menu.
                </p>
                <CopyCommand command={INSTALL_DESKTOP_COMMAND} wrap className="py-2.75 pr-3 pl-3.5 text-[13px]" />
              </Platform>
              <Platform title="Windows" meta="x86_64 · .zip · experimental">
                <p>
                  Built and tested on every change, but not yet run by anybody who works on Crook: there to try. It is unsigned, so
                  SmartScreen asks once; More info, then Run anyway.
                </p>
                <Button variant="outline" size="lg" nativeButton={false} render={<a href={WINDOWS_ZIP_URL} />}>
                  Download the .zip
                </Button>
              </Platform>
            </div>
            <p className="mt-6.5 max-w-[70ch] text-[14.5px] text-muted-foreground [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-px">
              Building it yourself takes the Rust toolchain <code>rust-toolchain.toml</code> pins, and no build scripts. <code>script/run</code>{" "}
              starts it from the checkout and <code>script/bundle</code> makes the release binary; <code>--snapshot</code> draws a frame to a PNG without opening a window.
            </p>
          </Container>
        </section>
      </main>

      <div className="relative z-10 bg-[#050608]/80 backdrop-blur-md">
        <SiteFooter />
      </div>
    </div>
  );
}

function Platform({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5.5 [&>p]:mb-4 [&>p]:text-[15px] [&>p]:text-ink-2">
      <h3 className="mb-1 text-[19px] font-semibold">{title}</h3>
      <div className="mb-3.5 font-mono text-[12.5px] text-muted-foreground">{meta}</div>
      {children}
    </div>
  );
}
