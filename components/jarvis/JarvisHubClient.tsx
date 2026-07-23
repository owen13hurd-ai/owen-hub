"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Database, Download, FilePlus2, Loader2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SearchResult = {
  filename: string;
  matches: Array<{ context: string }>;
  score: number;
};

type PokemonProductResult = {
  msrp: number | null;
  name: string;
  product_type: string;
  set_name: string | null;
};

type PokemonIntelligenceExport = {
  collectionItems: unknown[];
  priceObservations: unknown[];
  products: unknown[];
  purchases: unknown[];
  restockObservations: unknown[];
  sets: unknown[];
  watchlist: unknown[];
};

type JarvisNoteType = "decision" | "project" | "research" | "source" | "task";

const noteTypeConfig: Record<JarvisNoteType, { folder: string; label: string; status: string; type: string }> = {
  decision: { folder: "13 Decisions", label: "Decision", status: "draft", type: "decision" },
  project: { folder: "01 Projects", label: "Project", status: "draft", type: "project" },
  research: { folder: "03 Knowledge", label: "Research", status: "draft", type: "research" },
  source: { folder: "04 Resources", label: "Source", status: "draft", type: "source" },
  task: { folder: "00 Inbox", label: "Task", status: "draft", type: "task" },
};

async function api<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

function money(value: number | null) {
  return value === null ? "MSRP not set" : new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugifyTitle(title: string) {
  return title
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildDraftNote(type: JarvisNoteType, title: string, body: string) {
  const config = noteTypeConfig[type];
  const cleanTitle = slugifyTitle(title) || "Untitled";
  const date = today();
  const filename = `${config.label} - ${cleanTitle} - ${date}.md`;
  const path = `${config.folder}/${filename}`;
  const content = `---
type: ${config.type}
status: ${config.status}
source: personal
confidence: medium
created: ${date}
updated: ${date}
related_records: []
tags:
  - jarvis
---

# ${config.label} - ${cleanTitle}

## Raw Note

${body.trim() || "- Add notes here."}

## Sources

- Owen direct input on ${date}

## Follow Up

- [ ] Review this note before treating it as confirmed memory.
`;
  return { content, path };
}

export function JarvisHubClient() {
  const [status, setStatus] = useState<"checking" | "connected" | "offline" | "unconfigured">("checking");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<SearchResult[]>([]);
  const [products, setProducts] = useState<PokemonProductResult[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [noteType, setNoteType] = useState<JarvisNoteType>("research");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const readiness = useMemo(() => [
    { label: "Obsidian vault", ok: status === "connected", detail: status === "connected" ? "Connected" : status === "unconfigured" ? "API key needed" : "Open Obsidian" },
    { label: "Structured database", ok: !message.toLowerCase().includes("pokemon"), detail: "Supabase powers records" },
    { label: "AI answers", ok: false, detail: "Waiting for citation layer" },
  ], [message, status]);

  const checkStatus = useCallback(async () => {
    setStatus("checking");
    try {
      const response = await fetch("/api/obsidian?action=status", { cache: "no-store" });
      if (response.status === 503) {
        setStatus("unconfigured");
        return;
      }
      if (!response.ok) throw new Error();
      setStatus("connected");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkStatus(), 0);
    return () => window.clearTimeout(timer);
  }, [checkStatus]);

  async function search() {
    const needle = query.trim();
    if (!needle) return;
    setBusy(true);
    setMessage("");
    try {
      const [noteData, pokemonData] = await Promise.allSettled([
        api<{ results: SearchResult[] }>(`/api/obsidian?action=search&query=${encodeURIComponent(needle)}`),
        api<{ products: PokemonProductResult[] }>("/api/pokemon/intelligence"),
      ]);
      if (noteData.status === "fulfilled") setNotes(noteData.value.results.slice(0, 10));
      else setNotes([]);
      if (pokemonData.status === "fulfilled") {
        setProducts(pokemonData.value.products.filter((product) => [product.name, product.set_name, product.product_type].some((value) => value?.toLowerCase().includes(needle.toLowerCase()))).slice(0, 10));
      } else {
        setProducts([]);
      }
      if (noteData.status === "rejected" && pokemonData.status === "rejected") {
        throw new Error("Neither Obsidian nor Pokemon records could be searched yet.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function exportJarvisMetadata() {
    setBusy(true);
    setMessage("");
    try {
      const [statusData, pokemonData] = await Promise.allSettled([
        api<{ configured: boolean; status?: unknown }>("/api/obsidian?action=status"),
        api<PokemonIntelligenceExport>("/api/pokemon/intelligence"),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        jarvis: {
          obsidian: statusData.status === "fulfilled" ? statusData.value : { available: false },
          sourcePolicy: "Draft summaries and structured records must cite sources before becoming confirmed memory.",
        },
        pokemonIntelligence: pokemonData.status === "fulfilled" ? pokemonData.value : { available: false },
      };
      downloadJson("jarvis-metadata-export.json", payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createDraftNote() {
    if (!noteTitle.trim()) {
      toast.info("Add a note title first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const draft = buildDraftNote(noteType, noteTitle, noteBody);
      const response = await fetch("/api/obsidian", {
        body: JSON.stringify(draft),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; path?: string };
      if (!response.ok) throw new Error(payload.error ?? "Note could not be created.");
      toast.success(`Draft note created: ${payload.path ?? draft.path}`);
      setNoteTitle("");
      setNoteBody("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Note could not be created.");
      toast.error(error instanceof Error ? error.message : "Note could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Tabs defaultValue="search" className="flex flex-col gap-5">
      <div className="overflow-x-auto pb-1">
        <TabsList className="h-10 min-w-max">
          <TabsTrigger value="search"><Search />Search</TabsTrigger>
          <TabsTrigger value="create"><FilePlus2 />Create</TabsTrigger>
          <TabsTrigger value="sources"><ShieldCheck />Source Rules</TabsTrigger>
          <TabsTrigger value="status"><Database />Status</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="search" className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Ask Jarvis Search</CardTitle>
                <p className="mt-1 text-sm text-ink/55">This is pre-AI on purpose: it finds supporting notes and Pokemon records before we let AI answer from them.</p>
              </div>
              <Button variant="outline" onClick={exportJarvisMetadata} disabled={busy}><Download />Export JSON</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} placeholder="Search notes and Pokemon records" />
              <Button onClick={search} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Search />}Search</Button>
            </div>
            {message ? <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-950">{message}</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Obsidian Notes</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {notes.map((result) => (
                <div key={result.filename} className="rounded-md border border-ink/10 p-3">
                  <p className="truncate font-semibold text-ink">{result.filename}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink/55">{result.matches[0]?.context ?? "Matching note"}</p>
                </div>
              ))}
              {!notes.length ? <p className="text-sm text-ink/55">No note results yet.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pokemon Records</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {products.map((product) => (
                <div key={product.name} className="rounded-md border border-ink/10 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{product.name}</p>
                    <Badge variant="outline">{product.product_type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink/55">{product.set_name ?? "No set"} · {money(product.msrp)}</p>
                </div>
              ))}
              {!products.length ? <p className="text-sm text-ink/55">No Pokemon records yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="create">
        <Card>
          <CardHeader>
            <CardTitle>Create Draft Note</CardTitle>
            <p className="mt-1 text-sm text-ink/55">Capture the thought quickly. Jarvis saves it as a draft so you can review it before it becomes confirmed memory.</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <label className="grid gap-1.5 text-sm font-semibold text-ink">
                <span>Note type</span>
                <Select value={noteType} onValueChange={(value) => setNoteType(value as JarvisNoteType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-ink">
                <span>Title</span>
                <Input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Example: Prismatic Evolutions ETB buying rules" />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              <span>Raw note</span>
              <Textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} rows={8} placeholder="Type the rough note here. It can be messy." />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-3 text-sm text-ink/60">
              <span>Will save under {noteTypeConfig[noteType].folder}</span>
              <Button onClick={createDraftNote} disabled={busy}><FilePlus2 />Create draft</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sources">
        <Card>
          <CardHeader><CardTitle>Memory Rules</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-ink/65">
            <p><strong className="text-ink">Raw notes stay raw.</strong> Jarvis can summarize them later, but it should not overwrite the original source.</p>
            <p><strong className="text-ink">Confirmed facts need support.</strong> A fact should come from Owen, a direct source, or a reviewed note.</p>
            <p><strong className="text-ink">AI answers need citations.</strong> If Jarvis cannot find evidence, it should say it does not know.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="status">
        <div className="grid gap-3 md:grid-cols-3">
          {readiness.map((item) => (
            <div key={item.label} className="rounded-md border border-ink/10 bg-white p-4">
              <div className="flex items-center gap-2">
                {item.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <BookOpen className="h-4 w-4 text-amber-700" />}
                <p className="font-semibold text-ink">{item.label}</p>
              </div>
              <p className="mt-2 text-sm text-ink/55">{item.detail}</p>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
