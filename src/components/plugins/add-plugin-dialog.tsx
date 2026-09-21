"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGISTRY_URL } from "@/data/site";
import { cn } from "@/lib/utils";

const LICENCES = ["MIT", "Apache-2.0", "MIT OR Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "MPL-2.0"];

const CHECKLIST = [
  <>
    <code>cargo build --release --locked --target wasm32-unknown-unknown</code> produces exactly one <code>.wasm</code>
  </>,
  <>
    The module&rsquo;s own id is the id above. <code>crook-plugin-info</code> reads it; a mismatch fails the build.
  </>,
  <>
    Icon and previews are inside the module (<code>icon!</code> and <code>preview!</code> from crook_plugin_api)
  </>,
  <>If it asks to type or run commands, the description says why each exact command is needed</>,
];

const CI_STEPS = [
  "Checks the four rules above before cloning anything.",
  "Checks out the commit and builds it with the toolchain your repository pins. That job can publish nothing.",
  "Reads id, version, ABI, capabilities, icon and previews out of the artifact and hashes it.",
  "A second job uploads the .wasm, then rewrites index.json last, so a publish that stops halfway names only files already there.",
];

function toml(id: string, repo: string, lic: string, ref: string) {
  return `schema = 1

id = "${id || "you/thing"}"
repository = "${repo || "https://github.com/you/crook-thing"}"
license = "${lic}"

# Newest last. A ref is a commit rather than a tag: what is built is what is
# indexed, and a tag can be moved after it is reviewed.
[[release]]
ref = "${ref || "0123456789abcdef0123456789abcdef01234567"}"
`;
}

export function AddPluginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [id, setId] = useState("");
  const [repo, setRepo] = useState("");
  const [lic, setLic] = useState("MIT");
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState(false);

  const v = useMemo(() => {
    const idOk = /^[a-z0-9_-]+\/[a-z0-9_-]+$/.test(id);
    const owner = idOk ? id.split("/")[0] : null;
    const m = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(repo);
    const repoOk = !!m && (!owner || m[1].toLowerCase() === owner);
    const refOk = /^[0-9a-f]{40}$/.test(ref);
    const dir = idOk ? id.replace("/", ".") : "<owner>.<name>";
    const text = toml(id, repo, lic, ref);
    const prUrl = `${REGISTRY_URL}/new/main?filename=${encodeURIComponent(`plugins/${dir}/plugin.toml`)}&value=${encodeURIComponent(text)}`;
    return { idOk, repoOk, refOk, all: idOk && repoOk && refOk, dir, text, prUrl };
  }, [id, repo, lic, ref]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(v.text);
    } catch {
      /* the text is on screen either way */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-6 max-h-[calc(100svh-3rem)] w-[min(1040px,calc(100%-1.25rem))] translate-y-0 gap-0 overflow-y-auto rounded-2xl bg-background p-0 text-base sm:max-w-[1040px] sm:top-10 sm:max-h-[calc(100svh-5rem)]">
        <div className="border-b border-border px-5 pt-6 pr-14 pb-4.5 sm:px-7">
          <DialogTitle className="font-heading text-2xl font-bold sm:text-[28px]">Add a plugin to the registry</DialogTitle>
          <DialogDescription className="mt-1.5 max-w-[66ch] text-[15px] text-ink-2">
            One plugin per pull request, one directory, one file. Everything else about the plugin is read out of the artifact CI builds
            from the commit you name here, so there is nothing to keep in step.
          </DialogDescription>
        </div>

        <div className="grid md:grid-cols-2">
          <div className="px-5 py-5 sm:px-7">
            <Field label="Plugin id" hint="owner/name, lowercase letters, digits, - and _. The owner is your GitHub login: the directory is yours under CODEOWNERS.">
              <Input value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="you/thing" spellCheck={false} aria-invalid={!!id && !v.idOk} className={fieldClass(id, v.idOk)} />
            </Field>
            <Field label="Repository" hint="Exactly https://github.com/<owner>/<repo>. Anything else becomes git's argument.">
              <Input value={repo} onChange={(e) => setRepo(e.target.value.trim())} placeholder="https://github.com/you/crook-thing" spellCheck={false} aria-invalid={!!repo && !v.repoOk} className={fieldClass(repo, v.repoOk)} />
            </Field>
            <Field label="Licence" hint="Named here, and present in the repository the entry points at.">
              <Select value={lic} onValueChange={(x) => x && setLic(x)} items={Object.fromEntries(LICENCES.map((l) => [l, l]))}>
                <SelectTrigger className="h-9.5 w-full font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENCES.map((l) => (
                    <SelectItem key={l} value={l} className="font-mono">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Commit to build" hint="A full commit, not a tag: what is built is what is indexed, and a tag can be moved after review.">
              <Input value={ref} onChange={(e) => setRef(e.target.value.trim().toLowerCase())} placeholder="40 hexadecimal characters" maxLength={40} spellCheck={false} aria-invalid={!!ref && !v.refOk} className={fieldClass(ref, v.refOk)} />
            </Field>

            <ul className="mt-1.5 grid list-none gap-1.5 p-0 text-[13.5px]">
              <Rule state={id ? v.idOk : null}>Id is <code>owner/name</code> in lowercase</Rule>
              <Rule state={repo ? v.repoOk : null}>Repository is on github.com under the same owner</Rule>
              <Rule state={ref ? v.refOk : null}>Ref is a 40-character commit hash</Rule>
            </ul>

            <div className="mt-5.5">
              <h3 className="mb-2 font-mono text-[12.5px] font-medium text-muted-foreground">before opening the pull request</h3>
              <ul className="grid list-none gap-2.5 p-0 text-sm text-ink-2">
                {CHECKLIST.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Checkbox id={`check-${i}`} className="mt-0.75" />
                    <Label htmlFor={`check-${i}`} className="font-normal leading-normal">{c}</Label>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4.5 max-w-[50ch] text-[13px] text-muted-foreground">
              Review takes up to three weeks. A pull request nobody has answered by then is closed rather than left open, and can be reopened
              whenever.
            </p>
          </div>

          <div className="border-t border-border bg-muted px-5 py-5 sm:px-7 md:rounded-br-2xl md:border-t-0 md:border-l">
            <div className="mb-2 font-mono text-[12.5px] text-muted-foreground">plugins/{v.dir}/plugin.toml</div>
            <pre className="m-0 overflow-x-auto rounded-[10px] bg-frame px-4 py-3.5 font-mono text-[13px] leading-[1.55] whitespace-pre text-frame-ink">
              {v.text.split("\n").map((line, i) => (
                <TomlLine key={i} line={line} />
              ))}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2.5 [&>*]:max-sm:w-full">
              <Button
                size="lg"
                render={<Link href={v.prUrl} target="_blank" rel="noopener" />}
                aria-disabled={!v.all}
                className={cn(!v.all && "pointer-events-none opacity-45")}
              >
                Open a pull request on GitHub
              </Button>
              <Button size="lg" variant="outline" onClick={copy}>
                {copied ? "Copied" : "Copy plugin.toml"}
              </Button>
            </div>
            <p className="mt-3 max-w-[46ch] text-[13px] text-muted-foreground">
              The button opens GitHub&rsquo;s new-file editor in a fork of the registry with this path and content filled in. Commit it to a
              branch there and GitHub offers the pull request.
            </p>
            <div className="mt-6.5">
              <h3 className="mb-2.5 font-mono text-[12.5px] font-medium text-muted-foreground">what ci does with it</h3>
              <ol className="grid list-none gap-1.5 p-0 text-[14.5px] text-ink-2">
                {CI_STEPS.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <b className="min-w-4 font-mono text-[12.5px] font-medium text-yolk-text">{i + 1}</b>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function fieldClass(value: string, ok: boolean) {
  return cn("h-9.5 font-mono text-sm", value && (ok ? "border-chart-5" : "border-destructive"));
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 grid gap-1.25">
      <Label className="text-[13.5px] font-semibold">{label}</Label>
      {children}
      <span className="text-[12.5px] text-muted-foreground">{hint}</span>
    </div>
  );
}

function Rule({ state, children }: { state: boolean | null; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-start gap-2.25", state === false ? "text-foreground" : "text-ink-2")}>
      <i
        className={cn(
          "mt-0.5 inline-grid size-4 shrink-0 place-items-center rounded-full border border-line-2 bg-muted text-white",
          state === true && "border-chart-5 bg-chart-5",
          state === false && "border-destructive bg-destructive",
        )}
      >
        {state === true && <CheckIcon className="size-2.5" />}
        {state === false && <XIcon className="size-2.5" />}
      </i>
      <span>{children}</span>
    </li>
  );
}

function TomlLine({ line }: { line: string }) {
  if (line.startsWith("#")) return <span className="block text-frame-mute">{line}</span>;
  if (line.startsWith("[[")) return <span className="block text-[#b09dff]">{line}</span>;
  const m = /^(\w+) = (.*)$/.exec(line);
  if (m) {
    return (
      <span className="block">
        <span className="text-[#b09dff]">{m[1]}</span> = <span className={m[2].startsWith('"') ? "text-yolk" : ""}>{m[2]}</span>
      </span>
    );
  }
  return <span className="block">{line || " "}</span>;
}
