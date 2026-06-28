"use client";

import { BookOpen, Check, FilePlus2, Loader2, RefreshCcw, Save, Search, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type VaultNote = {
  backlinks: string[];
  content: string;
  links: string[];
  path: string;
  tags: string[];
};

type SearchResult = {
  filename: string;
  matches: Array<{ context: string }>;
  score: number;
};

const inputClass = "h-10 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none focus:border-moss";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Obsidian could not be reached.");
  return data;
}

export function ObsidianNotesHub() {
  const [status, setStatus] = useState<"checking" | "connected" | "offline" | "unconfigured">("checking");
  const [files, setFiles] = useState<string[]>([]);
  const [tags, setTags] = useState<Array<{ count: number; name: string }>>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<VaultNote | null>(null);
  const [draftPath, setDraftPath] = useState("Owen's Hub/Inbox/New note.md");
  const [draftContent, setDraftContent] = useState("# New note\n\n");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStatus("checking");
    try {
      const statusResponse = await fetch("/api/obsidian?action=status");
      if (statusResponse.status === 503) {
        setStatus("unconfigured");
        return;
      }
      if (!statusResponse.ok) throw new Error();
      const [fileData, tagData] = await Promise.all([
        api<{ files: string[] }>("/api/obsidian?action=list"),
        api<{ tags: Array<{ count: number; name: string }> }>("/api/obsidian?action=tags"),
      ]);
      setFiles(fileData.files);
      setTags(tagData.tags.slice(0, 12));
      setStatus("connected");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function openNote(path: string) {
    if (path.endsWith("/")) return;
    setBusy(true);
    setMessage("");
    try {
      const note = await api<VaultNote>(`/api/obsidian?action=read&path=${encodeURIComponent(path)}`);
      setSelected(note);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Note could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ results: SearchResult[] }>(`/api/obsidian?action=search&query=${encodeURIComponent(query)}`);
      setResults(data.results);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save(path: string, content: string) {
    setBusy(true);
    setMessage("");
    try {
      const data = await api<{ path: string }>("/api/obsidian", {
        body: JSON.stringify({ content, path }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      setMessage(`Saved ${data.path}`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Note could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">Notes Hub</p><h1 className="mt-1 text-3xl font-bold text-ink">Obsidian workspace</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">Your local Markdown vault, available inside Owen&apos;s Hub.</p></div>
        <div className="flex items-center gap-2"><span className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold ${status === "connected" ? "bg-emerald-50 text-emerald-800" : status === "checking" ? "bg-mist text-ink/55" : "bg-amber-50 text-amber-800"}`}>{status === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}{status === "connected" && <Check className="h-4 w-4" />}{status === "connected" ? "Connected" : status === "unconfigured" ? "Setup required" : status === "offline" ? "Obsidian offline" : "Checking"}</span><button type="button" aria-label="Refresh Obsidian connection" onClick={() => void refresh()} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 bg-white text-ink"><RefreshCcw className="h-4 w-4" /></button></div>
      </header>

      {status === "unconfigured" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Obsidian connection is ready for its API key.</strong><br />Install and enable Local REST API with MCP in Obsidian, enable its HTTP server, then add <code className="rounded bg-white px-1.5 py-1">OBSIDIAN_API_KEY</code> to <code className="rounded bg-white px-1.5 py-1">.env.local</code>.</div>}
      {status === "offline" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">The bridge is configured, but Obsidian is not responding. Open Obsidian and confirm Local REST API&apos;s HTTP server is enabled.</div>}

      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-ink/35" /><input aria-label="Search Obsidian vault" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void search(); }} placeholder="Search the vault" className={`${inputClass} w-full pl-9`} /></div><button type="button" onClick={() => void search()} disabled={busy || status !== "connected"} className="h-10 rounded-md bg-ink px-4 text-sm font-bold text-white disabled:opacity-40">Search</button></div>
        {results.length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2">{results.slice(0, 12).map((result) => <button type="button" key={result.filename} onClick={() => void openNote(result.filename)} className="min-w-0 rounded-md bg-mist p-3 text-left"><span className="block truncate font-bold text-ink">{result.filename}</span><span className="mt-1 line-clamp-2 text-xs leading-5 text-ink/55">{result.matches[0]?.context || "Matching note"}</span></button>)}</div>}
      </section>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-moss" /><h2 className="font-bold text-ink">Vault</h2></div><div className="mt-3 max-h-80 space-y-1 overflow-y-auto">{files.filter((file) => !file.endsWith("/")).slice(0, 60).map((file) => <button key={file} type="button" onClick={() => void openNote(file)} className="block w-full truncate rounded-md px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-mist">{file}</button>)}{status === "connected" && files.length === 0 && <p className="rounded-md bg-mist p-3 text-sm text-ink/55">No root notes found.</p>}</div></section>
          {tags.length > 0 && <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"><div className="flex items-center gap-2"><Tags className="h-4 w-4 text-moss" /><h2 className="font-bold text-ink">Top tags</h2></div><div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <button type="button" onClick={() => { setQuery(`#${tag.name}`); }} key={tag.name} className="rounded bg-mist px-2 py-1 text-xs font-semibold text-ink">#{tag.name} · {tag.count}</button>)}</div></section>}
        </aside>

        <main className="min-w-0 rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          {selected ? <><div className="flex flex-col justify-between gap-3 border-b border-ink/10 pb-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.1em] text-moss">Open note</p><h2 className="mt-1 truncate font-bold text-ink">{selected.path}</h2></div><button type="button" onClick={() => void save(selected.path, selected.content)} disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white disabled:opacity-40"><Save className="h-4 w-4" />Save changes</button></div><textarea aria-label="Note content" value={selected.content} onChange={(event) => setSelected({ ...selected, content: event.target.value })} className="mt-4 min-h-[520px] w-full resize-y bg-transparent font-mono text-sm leading-7 text-ink outline-none" /></> : <><div className="flex items-center gap-2"><FilePlus2 className="h-5 w-5 text-moss" /><h2 className="font-bold text-ink">Quick capture</h2></div><input aria-label="New note path" value={draftPath} onChange={(event) => setDraftPath(event.target.value)} className={`${inputClass} mt-4 w-full`} /><textarea aria-label="New note content" value={draftContent} onChange={(event) => setDraftContent(event.target.value)} className="mt-3 min-h-[380px] w-full resize-y rounded-md border border-ink/10 bg-mist p-4 font-mono text-sm leading-7 text-ink outline-none focus:border-moss" /><button type="button" onClick={() => void save(draftPath, draftContent)} disabled={busy || status !== "connected"} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white disabled:opacity-40"><FilePlus2 className="h-4 w-4" />Create note</button></>}
        </main>
      </div>

      {message && <p aria-live="polite" className="rounded-md bg-mist px-4 py-3 text-sm font-semibold text-ink">{message}</p>}
    </div>
  );
}
