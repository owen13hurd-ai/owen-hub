"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Archive, BarChart3, Bell, CalendarClock, Calculator, Database, Download, FileInput, FilePlus2, Layers3, PackagePlus, Plus, Radar, ReceiptText, RefreshCcw, Search, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculatePurchase, formatMoney, formatPercent } from "@/lib/pokemon-intelligence/calculations";
import { bestCatalogMarketPrice } from "@/lib/pokemon-intelligence/catalog-pricing";
import type { CollectrImportPreview } from "@/lib/pokemon-intelligence/collectr";
import { findCollectionDuplicates, findOpportunityMatches } from "@/lib/pokemon-intelligence/opportunities";
import { summarizePokemonPortfolio } from "@/lib/pokemon-intelligence/portfolio";
import { buildReleaseRadar, findUnwatchedUpcoming } from "@/lib/pokemon-intelligence/release-radar";
import type { PokemonIntelligenceProduct, PokemonIntelligenceSnapshot } from "@/lib/pokemon-intelligence/types";
import { cn } from "@/lib/utils";
import { cleanEditValues, downloadCsv, editableFields, emptySnapshot, Field, ProductSelect, type CatalogCard, type CatalogSet, type EditState } from "./shared";

export function PokemonIntelligenceClient() {
  const [snapshot, setSnapshot] = useState<PokemonIntelligenceSnapshot>(emptySnapshot);
  const [query, setQuery] = useState("");
  const [setupError, setSetupError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [catalogType, setCatalogType] = useState<"cards" | "sets">("sets");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogSets, setCatalogSets] = useState<CatalogSet[]>([]);
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([]);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [collectrPreview, setCollectrPreview] = useState<CollectrImportPreview | null>(null);
  const [collectrFileName, setCollectrFileName] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [selectedCalcProduct, setSelectedCalcProduct] = useState<PokemonIntelligenceProduct | null>(null);
  const [calc, setCalc] = useState({
    estimatedResalePrice: 0,
    extraFees: 0,
    feesPercent: 13.25,
    itemPrice: 0,
    quantity: 1,
    shipping: 0,
    tax: 0,
  });

  const calculation = calculatePurchase(calc);
  const opportunityMatches = useMemo(() => findOpportunityMatches(snapshot), [snapshot]);
  const duplicateWarnings = useMemo(() => findCollectionDuplicates(snapshot), [snapshot]);
  const portfolioSummary = useMemo(() => summarizePokemonPortfolio(snapshot), [snapshot]);
  const releaseRadar = useMemo(() => buildReleaseRadar(snapshot), [snapshot]);
  const unwatchedUpcoming = useMemo(() => findUnwatchedUpcoming(snapshot), [snapshot]);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return snapshot.products;
    return snapshot.products.filter((product) => [product.name, product.set_name, product.product_type].some((value) => value?.toLowerCase().includes(needle)));
  }, [query, snapshot.products]);

  const totalCollectionValue = snapshot.collectionItems.reduce((sum, item) => sum + ((item.estimated_value ?? 0) * item.quantity), 0);
  const totalSpend = snapshot.purchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
  const activeWatchlist = snapshot.watchlist.filter((item) => item.enabled);
  const buyZoneMatches = opportunityMatches.filter((match) => match.status === "buy-zone");
  const staleSignals = opportunityMatches.filter((match) => match.status === "stale");
  const upcomingReleases = releaseRadar.filter((item) => item.status === "upcoming");
  const missingValueItems = snapshot.collectionItems.filter((item) => item.estimated_value === null || item.estimated_value === 0);
  const missingReleaseDates = snapshot.products.filter((product) => !product.release_date).length + snapshot.sets.filter((set) => !set.release_date).length;
  const nextRelease = upcomingReleases[0] ?? null;
  const priorityActions = [
    buyZoneMatches.length ? { detail: `${buyZoneMatches.length} watchlist match${buyZoneMatches.length === 1 ? "" : "es"} at or below target.`, label: "Review buy-zone signals", tone: "emerald" } : null,
    unwatchedUpcoming.length ? { detail: `${unwatchedUpcoming.length} upcoming release${unwatchedUpcoming.length === 1 ? "" : "s"} missing watchlist coverage.`, label: "Add release watches", tone: "amber" } : null,
    duplicateWarnings.length ? { detail: `${duplicateWarnings.length} duplicate group${duplicateWarnings.length === 1 ? "" : "s"} may be inflating counts.`, label: "Clean collection rows", tone: "amber" } : null,
    missingValueItems.length ? { detail: `${missingValueItems.length} collection row${missingValueItems.length === 1 ? "" : "s"} need estimated values.`, label: "Fill value gaps", tone: "slate" } : null,
    staleSignals.length ? { detail: `${staleSignals.length} signal${staleSignals.length === 1 ? "" : "s"} older than 14 days.`, label: "Refresh stale prices", tone: "slate" } : null,
  ].filter((item): item is { detail: string; label: string; tone: string } => Boolean(item));
  const recentActivity = [
    ...snapshot.purchases.slice(0, 4).map((purchase) => ({
      date: purchase.purchase_date,
      detail: `${purchase.retailer ?? "Purchase"} - ${formatMoney(purchase.total_cost)}`,
      id: `purchase-${purchase.id}`,
      label: purchase.product_name,
      type: "Purchase",
    })),
    ...snapshot.restockObservations.slice(0, 4).map((observation) => ({
      date: observation.observed_at,
      detail: `${observation.retailer} - ${observation.stock_status.replaceAll("-", " ")}`,
      id: `restock-${observation.id}`,
      label: observation.product_name,
      type: "Restock",
    })),
    ...snapshot.priceObservations.slice(0, 4).map((observation) => ({
      date: observation.observed_at,
      detail: `${observation.source} - ${formatMoney(observation.price + observation.shipping)}`,
      id: `price-${observation.id}`,
      label: observation.product_name,
      type: "Price",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  async function refresh() {
    try {
      const response = await fetch("/api/pokemon/intelligence", { cache: "no-store" });
      const payload = (await response.json()) as PokemonIntelligenceSnapshot & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Pokemon Intelligence could not load.");
      setSnapshot(payload);
      setSetupError("");
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Pokemon Intelligence could not load.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        const response = await fetch("/api/pokemon/intelligence", { body: data, method: "POST" });
        const payload = (await response.json()) as { error?: string; path?: string };
        if (!response.ok) throw new Error(payload.error ?? "Save failed.");
        toast.success(payload.path ? `Draft note created: ${payload.path}` : "Saved to Pokemon Intelligence");
        form.reset();
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed.");
      }
    });
  }

  async function deleteRecord(kind: "card" | "collection" | "price" | "product" | "purchase" | "restock" | "set" | "watchlist", id: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/pokemon/intelligence?kind=${kind}&id=${id}`, { method: "DELETE" });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Delete failed.");
        toast.success("Record deleted");
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed.");
      }
    });
  }

  async function saveEdit() {
    if (!editState) return;
    startTransition(async () => {
      try {
        const response = await fetch("/api/pokemon/intelligence", {
          body: JSON.stringify({
            id: editState.id,
            kind: editState.kind,
            values: cleanEditValues(editState.kind, editState.values),
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Update failed.");
        toast.success("Record updated");
        setEditState(null);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Update failed.");
      }
    });
  }

  async function searchCatalog() {
    setCatalogBusy(true);
    try {
      const response = await fetch(`/api/pokemon/tcg-catalog?type=${catalogType}&q=${encodeURIComponent(catalogQuery)}`, { cache: "no-store" });
      const payload = (await response.json()) as { data?: CatalogSet[] | CatalogCard[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Catalog lookup failed.");
      if (catalogType === "sets") {
        setCatalogSets((payload.data ?? []) as CatalogSet[]);
        setCatalogCards([]);
      } else {
        setCatalogCards((payload.data ?? []) as CatalogCard[]);
        setCatalogSets([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog lookup failed.");
    } finally {
      setCatalogBusy(false);
    }
  }

  async function postFormData(data: Record<string, string>) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.set(key, value));
    const response = await fetch("/api/pokemon/intelligence", { body: formData, method: "POST" });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Import failed.");
  }

  async function quickImport(data: Record<string, string>) {
    startTransition(async () => {
      try {
        await postFormData(data);
        toast.success("Imported to Pokemon Intelligence");
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import failed.");
      }
    });
  }

  async function importCatalogCardWithPrice(card: CatalogCard) {
    const price = bestCatalogMarketPrice(card.tcgplayer?.prices);
    startTransition(async () => {
      try {
        await postFormData({
          action: "create-card",
          external_id: card.id,
          image_url: card.images?.large ?? card.images?.small ?? "",
          name: card.name,
          number: card.number,
          rarity: card.rarity ?? "",
          set_name: card.set.name,
          source_url: card.tcgplayer?.url ?? "",
          subtypes: (card.subtypes ?? []).join(", "),
          supertype: card.supertype,
        });

        if (price) {
          await postFormData({
            action: "create-price-observation",
            confidence: "medium",
            notes: `Imported from Pokemon TCG API catalog pricing. Variant: ${price.label}. API price date: ${card.tcgplayer?.updatedAt ?? "unknown"}.`,
            price: String(price.price),
            product_name: `${card.name} - ${card.set.name} #${card.number}`,
            shipping: "0",
            source: "Pokemon TCG API / TCGplayer",
            source_url: card.tcgplayer?.url ?? "",
          });
        }

        toast.success(price ? "Imported card and price snapshot" : "Imported card");
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import failed.");
      }
    });
  }

  async function previewCollectrFile(file: File | null) {
    if (!file) return;
    setCollectrFileName(file.name);
    try {
      const csv = await file.text();
      const response = await fetch("/api/pokemon/intelligence", {
        body: JSON.stringify({ action: "preview-collectr-csv", csv }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as CollectrImportPreview & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Collectr preview failed.");
      setCollectrPreview(payload);
      toast.success(`Found ${payload.rows.length} importable rows`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Collectr preview failed.");
    }
  }

  async function importCollectrPreview() {
    if (!collectrPreview?.rows.length) {
      toast.info("Preview a Collectr CSV first.");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/pokemon/intelligence", {
          body: JSON.stringify({ action: "import-collectr-rows", rows: collectrPreview.rows }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const payload = (await response.json()) as { error?: string; imported?: number };
        if (!response.ok) throw new Error(payload.error ?? "Collectr import failed.");
        toast.success(`Imported ${payload.imported ?? collectrPreview.rows.length} Collectr rows`);
        setCollectrPreview(null);
        setCollectrFileName("");
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Collectr import failed.");
      }
    });
  }

  async function mergeDuplicateRows(ids: string[]) {
    if (!window.confirm(`Merge ${ids.length} duplicate collection rows into one row?`)) return;
    startTransition(async () => {
      try {
        const response = await fetch("/api/pokemon/intelligence", {
          body: JSON.stringify({ action: "merge-collection-duplicates", ids }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const payload = (await response.json()) as { error?: string; merged?: number };
        if (!response.ok) throw new Error(payload.error ?? "Merge failed.");
        toast.success(`Merged ${payload.merged ?? ids.length} duplicate rows`);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Merge failed.");
      }
    });
  }

  return (
    <>
    <Tabs defaultValue="overview" className="flex flex-col gap-5">
      <div className="overflow-x-auto pb-1">
        <TabsList className="h-10 min-w-max" aria-label="Pokemon Intelligence sections">
          <TabsTrigger value="overview"><Sparkles />Overview</TabsTrigger>
          <TabsTrigger value="portfolio"><BarChart3 />Portfolio</TabsTrigger>
          <TabsTrigger value="releases"><CalendarClock />Releases</TabsTrigger>
          <TabsTrigger value="signals"><Radar />Signals</TabsTrigger>
          <TabsTrigger value="catalog"><Search />Catalog</TabsTrigger>
          <TabsTrigger value="sets"><Layers3 />Sets</TabsTrigger>
          <TabsTrigger value="cards"><Sparkles />Cards</TabsTrigger>
          <TabsTrigger value="products"><Database />Products</TabsTrigger>
          <TabsTrigger value="collection"><Archive />Collection</TabsTrigger>
          <TabsTrigger value="import"><FileInput />Import</TabsTrigger>
          <TabsTrigger value="purchase"><Calculator />Purchase</TabsTrigger>
          <TabsTrigger value="watch"><Bell />Watchlist</TabsTrigger>
          <TabsTrigger value="jarvis"><FilePlus2 />Jarvis</TabsTrigger>
        </TabsList>
      </div>

      {setupError ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-bold">Pokemon Intelligence needs its Supabase tables.</p>
          <p className="mt-1">Run the SQL in <code>supabase/migrations/0006_jarvis_pokemon_intelligence.sql</code> in Supabase, then refresh this page.</p>
          <p className="mt-2 text-xs">{setupError}</p>
        </div>
      ) : null}

      <TabsContent value="overview" className="space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-ink/10 bg-white p-4 shadow-[0_12px_35px_rgba(23,33,31,0.04)]">
            <p className="text-xs font-bold text-ink/45">COLLECTION VALUE</p>
            <p className="mt-2 text-2xl font-bold text-ink">{formatMoney(totalCollectionValue)}</p>
            <p className="mt-1 text-sm text-ink/50">{portfolioSummary.quantity} items across {portfolioSummary.itemCount} rows</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4 shadow-[0_12px_35px_rgba(23,33,31,0.04)]">
            <p className="text-xs font-bold text-ink/45">TRACKED SPEND</p>
            <p className="mt-2 text-2xl font-bold text-ink">{formatMoney(totalSpend)}</p>
            <p className={cn("mt-1 text-sm font-semibold", portfolioSummary.profitLoss >= 0 ? "text-emerald-700" : "text-red-700")}>
              {formatMoney(portfolioSummary.profitLoss)} / {formatPercent(portfolioSummary.profitLossPercent)}
            </p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4 shadow-[0_12px_35px_rgba(23,33,31,0.04)]">
            <p className="text-xs font-bold text-ink/45">BUY ZONE</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{buyZoneMatches.length}</p>
            <p className="mt-1 text-sm text-ink/50">{activeWatchlist.length} active watches</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4 shadow-[0_12px_35px_rgba(23,33,31,0.04)]">
            <p className="text-xs font-bold text-ink/45">NEXT RELEASE</p>
            <p className="mt-2 truncate text-lg font-bold text-ink">{nextRelease?.name ?? "No dated release"}</p>
            <p className="mt-1 text-sm text-ink/50">
              {nextRelease?.daysUntil === null || !nextRelease ? `${missingReleaseDates} missing dates` : `${nextRelease.daysUntil} days - ${nextRelease.releaseDate}`}
            </p>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <Card>
            <CardHeader className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <CardTitle>Priority Board</CardTitle>
                <p className="text-sm text-ink/55">The fastest path to making the tracker cleaner and more actionable.</p>
              </div>
              <Button variant="outline" onClick={refresh} disabled={isPending}><RefreshCcw className={cn(isPending && "animate-spin")} />Refresh</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorityActions.map((action) => (
                <div
                  key={action.label}
                  className={cn(
                    "rounded-md border p-3",
                    action.tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                    action.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-950",
                    action.tone === "slate" && "border-ink/10 bg-mist text-ink",
                  )}
                >
                  <p className="font-bold">{action.label}</p>
                  <p className="mt-1 text-sm opacity-75">{action.detail}</p>
                </div>
              ))}
              {!priorityActions.length ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                  <p className="font-bold">Clean board</p>
                  <p className="mt-1 text-sm">No urgent watchlist, release, duplicate, stale-price, or value cleanup items right now.</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-ink/55">Latest purchases, prices, and restock observations.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActivity.map((item) => (
                <div key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-ink/10 p-3">
                  <Badge variant="outline">{item.type}</Badge>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{item.label}</p>
                    <p className="truncate text-sm text-ink/55">{item.detail}</p>
                  </div>
                </div>
              ))}
              {!recentActivity.length ? <p className="text-sm text-ink/55">Add a purchase, price observation, or restock observation to start the activity feed.</p> : null}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">SETS</p>
            <p className="mt-2 text-2xl font-bold text-ink">{snapshot.sets.length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">PRODUCTS</p>
            <p className="mt-2 text-2xl font-bold text-ink">{snapshot.products.length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">UNWATCHED RELEASES</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{unwatchedUpcoming.length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">VALUE GAPS</p>
            <p className="mt-2 text-2xl font-bold text-ink">{missingValueItems.length}</p>
          </div>
        </section>
      </TabsContent>

      <TabsContent value="portfolio" className="space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">EST. VALUE</p>
            <p className="mt-2 text-2xl font-bold text-ink">{formatMoney(portfolioSummary.estimatedValue)}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">SPEND TRACKED</p>
            <p className="mt-2 text-2xl font-bold text-ink">{formatMoney(portfolioSummary.purchaseSpend)}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">P/L</p>
            <p className={cn("mt-2 text-2xl font-bold", portfolioSummary.profitLoss >= 0 ? "text-emerald-700" : "text-red-700")}>{formatMoney(portfolioSummary.profitLoss)}</p>
            <p className="mt-1 text-sm text-ink/50">{formatPercent(portfolioSummary.profitLossPercent)}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">ITEMS</p>
            <p className="mt-2 text-2xl font-bold text-ink">{portfolioSummary.quantity}</p>
            <p className="mt-1 text-sm text-ink/50">{portfolioSummary.itemCount} rows</p>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Value by Type</CardTitle>
              <p className="text-sm text-ink/55">Cards vs sealed vs anything else you track.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {portfolioSummary.valueByKind.map((bucket) => (
                <div key={bucket.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold capitalize text-ink">{bucket.label}</p>
                    <p className="text-ink/55">{formatMoney(bucket.value)} · {bucket.quantity} items</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full bg-moss" style={{ width: `${portfolioSummary.estimatedValue > 0 ? Math.max(4, (bucket.value / portfolioSummary.estimatedValue) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
              {!portfolioSummary.valueByKind.length ? <p className="text-sm text-ink/55">Add collection values to see exposure.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Value by Location</CardTitle>
              <p className="text-sm text-ink/55">Useful for knowing where the real value is stored.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {portfolioSummary.valueByLocation.map((bucket) => (
                <div key={bucket.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold text-ink">{bucket.label}</p>
                    <p className="text-ink/55">{formatMoney(bucket.value)} · {bucket.quantity} items</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full bg-ember" style={{ width: `${portfolioSummary.estimatedValue > 0 ? Math.max(4, (bucket.value / portfolioSummary.estimatedValue) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
              {!portfolioSummary.valueByLocation.length ? <p className="text-sm text-ink/55">Add storage locations to see where your value sits.</p> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Holdings</CardTitle>
            <p className="text-sm text-ink/55">Highest estimated-value rows in your collection.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Condition</TableHead><TableHead>Location</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
              <TableBody>
                {portfolioSummary.topItems.map((item) => (
                  <TableRow key={`${item.name}-${item.location}-${item.condition}`}>
                    <TableCell className="font-semibold">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.condition}</TableCell>
                    <TableCell>{item.location ?? "-"}</TableCell>
                    <TableCell>{formatMoney(item.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!portfolioSummary.topItems.length ? <p className="text-sm text-ink/55">Add estimated values to collection items to rank top holdings.</p> : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="releases" className="space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">UPCOMING</p>
            <p className="mt-2 text-2xl font-bold text-ink">{releaseRadar.filter((item) => item.status === "upcoming").length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">UNWATCHED</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{unwatchedUpcoming.length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">RECENT</p>
            <p className="mt-2 text-2xl font-bold text-ink">{releaseRadar.filter((item) => item.status === "recent").length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">UNSCHEDULED</p>
            <p className="mt-2 text-2xl font-bold text-ink/60">{releaseRadar.filter((item) => item.status === "unscheduled").length}</p>
          </div>
        </section>

        {unwatchedUpcoming.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Needs Watchlist Coverage</CardTitle>
              <p className="text-sm text-ink/55">These upcoming releases/products are not matched to an enabled watchlist item yet.</p>
            </CardHeader>
            <CardContent className="grid gap-2">
              {unwatchedUpcoming.slice(0, 8).map((item) => (
                <div key={item.id} className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm">{item.subtitle} · {item.releaseDate ?? "No date"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickImport({
                      action: "create-watchlist-item",
                      max_price: "",
                      name: item.name,
                      notes: `Added from Release Radar. Release date: ${item.releaseDate ?? "unknown"}.`,
                      priority: "high",
                      target_type: item.kind === "set" ? "set" : "sealed-product",
                    })}
                  >
                    <Plus />Watch
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Release Radar</CardTitle>
            <p className="text-sm text-ink/55">Built from your set/product release dates. Add missing dates on the Sets or Products tabs.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Release</TableHead><TableHead>Countdown</TableHead><TableHead>Watch</TableHead></TableRow></TableHeader>
              <TableBody>
                {releaseRadar.slice(0, 40).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-ink/45">{item.subtitle}</p>
                    </TableCell>
                    <TableCell className="capitalize">{item.kind}</TableCell>
                    <TableCell>{item.releaseDate ?? "No date"}</TableCell>
                    <TableCell>
                      {item.daysUntil === null ? "Unscheduled" : item.daysUntil >= 0 ? `${item.daysUntil}d` : `${Math.abs(item.daysUntil)}d ago`}
                    </TableCell>
                    <TableCell>
                      <Badge className={item.isWatched ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                        {item.isWatched ? "watched" : "missing"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!releaseRadar.length ? <p className="text-sm text-ink/55">Add sets or products with release dates to build the radar.</p> : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="signals" className="space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">BUY ZONE</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{opportunityMatches.filter((match) => match.status === "buy-zone").length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">WATCH</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{opportunityMatches.filter((match) => match.status === "watch").length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">STALE</p>
            <p className="mt-2 text-2xl font-bold text-ink/60">{opportunityMatches.filter((match) => match.status === "stale").length}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">DUPLICATES</p>
            <p className="mt-2 text-2xl font-bold text-ink">{duplicateWarnings.length}</p>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Watchlist Matches</CardTitle>
            <p className="text-sm text-ink/55">Matches your watchlist against manual prices and restock observations. Stale means older than 14 days.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signal</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunityMatches.slice(0, 25).map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      <p className="font-semibold text-ink">{match.title}</p>
                      <p className="text-xs text-ink/45">Matched {match.matchedName}</p>
                    </TableCell>
                    <TableCell>{match.source}</TableCell>
                    <TableCell>{formatMoney(match.currentPrice)}</TableCell>
                    <TableCell>{match.targetPrice === null ? "No target" : formatMoney(match.targetPrice)}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          match.status === "buy-zone" && "bg-emerald-100 text-emerald-800",
                          match.status === "watch" && "bg-amber-100 text-amber-800",
                          match.status === "avoid" && "bg-red-100 text-red-800",
                          match.status === "stale" && "bg-mist text-ink/65",
                        )}
                      >
                        {match.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{match.ageDays}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!opportunityMatches.length ? <p className="text-sm text-ink/55">Add watchlist items plus price/restock observations to create signals.</p> : null}
          </CardContent>
        </Card>

        {duplicateWarnings.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Cleanup</CardTitle>
              <p className="text-sm text-ink/55">These look like repeated collection rows with the same name, condition, and location.</p>
            </CardHeader>
            <CardContent className="grid gap-2">
              {duplicateWarnings.slice(0, 12).map((warning) => (
                <div key={warning.name} className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                  <TriangleAlert className="h-4 w-4" />
                  <div>
                    <p className="font-semibold">{warning.name}</p>
                    <p className="text-sm">Rows: {warning.count} · Qty: {warning.totalQuantity}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void mergeDuplicateRows(warning.ids)}>Merge</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </TabsContent>

      <TabsContent value="catalog" className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Pokemon TCG Catalog Lookup</CardTitle>
            <p className="text-sm text-ink/55">Search official card and set catalog data, then import only the records you care about.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_auto]">
              <Select value={catalogType} onValueChange={(value) => setCatalogType(value as "cards" | "sets")}>
                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sets">Sets</SelectItem>
                  <SelectItem value="cards">Cards</SelectItem>
                </SelectContent>
              </Select>
              <Input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && searchCatalog()} placeholder={catalogType === "sets" ? "Prismatic, Surging, Mega..." : "Pikachu, Charizard, Gengar..."} />
              <Button onClick={searchCatalog} disabled={catalogBusy}>{catalogBusy ? <RefreshCcw className="animate-spin" /> : <Search />}Search</Button>
            </div>
          </CardContent>
        </Card>

        {catalogSets.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {catalogSets.map((set) => (
              <Card key={set.id}>
                <CardHeader className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div>
                    <CardTitle>{set.name}</CardTitle>
                    <p className="mt-1 text-sm text-ink/55">{set.series} · {set.releaseDate} · {set.printedTotal}/{set.total} cards</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => quickImport({
                      action: "create-set",
                      era: set.series,
                      name: set.name,
                      notes: `Imported from Pokemon TCG API set ${set.id}. Printed total: ${set.printedTotal}. Total: ${set.total}.`,
                      release_date: set.releaseDate,
                    })}
                  >
                    <Plus />Import
                  </Button>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}

        {catalogCards.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {catalogCards.map((card) => (
              <Card key={card.id}>
                <CardHeader className="grid gap-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-start">
                  <div
                    aria-hidden="true"
                    className="h-24 w-16 rounded-md bg-mist bg-cover bg-center ring-1 ring-ink/10"
                    style={card.images?.small ? { backgroundImage: `url(${card.images.small})` } : undefined}
                  />
                  <div>
                    <CardTitle>{card.name}</CardTitle>
                    <p className="mt-1 text-sm text-ink/55">{card.set.name} · #{card.number} · {card.rarity ?? "Unknown rarity"}</p>
                    <p className="mt-1 text-xs text-ink/45">{[card.supertype, ...(card.subtypes ?? [])].join(" · ")}</p>
                    {bestCatalogMarketPrice(card.tcgplayer?.prices) ? (
                      <p className="mt-2 text-sm font-semibold text-moss">
                        {bestCatalogMarketPrice(card.tcgplayer?.prices)?.label}: {formatMoney(bestCatalogMarketPrice(card.tcgplayer?.prices)?.price)}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-ink/45">No market price in catalog result</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => quickImport({
                        action: "create-card",
                        external_id: card.id,
                        image_url: card.images?.large ?? card.images?.small ?? "",
                        name: card.name,
                        number: card.number,
                        rarity: card.rarity ?? "",
                        set_name: card.set.name,
                        source_url: card.tcgplayer?.url ?? "",
                        subtypes: (card.subtypes ?? []).join(", "),
                        supertype: card.supertype,
                      })}
                    >
                      <Plus />Card
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void importCatalogCardWithPrice(card)}>
                      <Plus />Card + price
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="sets" className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle>Add Set</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-set" />
              <Field label="Set name"><Input name="name" placeholder="Prismatic Evolutions" required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Era"><Input name="era" placeholder="Scarlet & Violet" /></Field>
                <Field label="Release date"><Input name="release_date" type="date" /></Field>
              </div>
              <Field label="Notes"><Textarea name="notes" placeholder="Products, chase cards, reprint risk, or personal interest." /></Field>
              <Button disabled={isPending}><Layers3 />Save set</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <CardTitle>Sets</CardTitle>
            <Button variant="outline" onClick={() => downloadCsv("pokemon-sets.csv", snapshot.sets)}><Download />Export</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Era</TableHead><TableHead>Release</TableHead><TableHead className="w-10"> </TableHead></TableRow></TableHeader>
              <TableBody>
                {snapshot.sets.map((set) => (
                  <TableRow key={set.id}>
                    <TableCell className="font-semibold">{set.name}</TableCell>
                    <TableCell>{set.era ?? "-"}</TableCell>
                    <TableCell>{set.release_date ?? "-"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" aria-label={`Delete ${set.name}`} onClick={() => deleteRecord("set", set.id)}><Trash2 /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cards" className="space-y-5">
        <Card>
          <CardHeader className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <CardTitle>Cards</CardTitle>
            <Button variant="outline" onClick={() => downloadCsv("pokemon-cards.csv", snapshot.cards)}><Download />Export</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Set</TableHead><TableHead>Rarity</TableHead><TableHead>No.</TableHead><TableHead className="w-10"> </TableHead></TableRow></TableHeader>
              <TableBody>
                {snapshot.cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-semibold">{card.name}</TableCell>
                    <TableCell>{card.set_name ?? "-"}</TableCell>
                    <TableCell>{card.rarity ?? "-"}</TableCell>
                    <TableCell>{card.number ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditState({ id: card.id, kind: "card", title: card.name, values: { name: card.name, notes: card.notes, number: card.number, rarity: card.rarity, set_name: card.set_name } })}>Edit</Button>
                        <Button variant="ghost" size="icon" aria-label={`Delete ${card.name}`} onClick={() => deleteRecord("card", card.id)}><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="import" className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Collectr CSV Import</CardTitle>
            <p className="text-sm text-ink/55">Export your collection from Collectr, preview it here, then import cards into Owen&apos;s Hub.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <Input
                accept=".csv,text/csv"
                aria-label="Collectr CSV file"
                type="file"
                onChange={(event) => void previewCollectrFile(event.target.files?.[0] ?? null)}
              />
              <Button onClick={importCollectrPreview} disabled={isPending || !collectrPreview?.rows.length}><FileInput />Import preview</Button>
            </div>
            {collectrFileName ? <p className="text-sm font-semibold text-ink/60">Previewing {collectrFileName}</p> : null}
            {collectrPreview?.warnings.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                {collectrPreview.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            ) : null}
            {collectrPreview ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md bg-mist p-3">
                  <p className="text-xs font-bold text-ink/45">ROWS FOUND</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{collectrPreview.rows.length}</p>
                </div>
                <div className="rounded-md bg-mist p-3">
                  <p className="text-xs font-bold text-ink/45">IGNORED</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{collectrPreview.ignoredRows}</p>
                </div>
                <div className="rounded-md bg-mist p-3">
                  <p className="text-xs font-bold text-ink/45">COLUMNS</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{collectrPreview.headers.length}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {collectrPreview?.rows.length ? (
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Card</TableHead><TableHead>Set</TableHead><TableHead>Qty</TableHead><TableHead>Condition</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                <TableBody>
                  {collectrPreview.rows.slice(0, 20).map((row, index) => (
                    <TableRow key={`${row.cardName}-${row.setName}-${index}`}>
                      <TableCell className="font-semibold">{row.cardName}</TableCell>
                      <TableCell>{row.setName ?? "-"}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.condition ?? "-"}</TableCell>
                      <TableCell>{formatMoney(row.estimatedValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {collectrPreview.rows.length > 20 ? <p className="mt-3 text-sm text-ink/55">Showing first 20 rows. Import will include all previewed rows.</p> : null}
            </CardContent>
          </Card>
        ) : null}
      </TabsContent>

      <TabsContent value="products" className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle>Add Product</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-product" />
              <Field label="Product name"><Input name="name" placeholder="Prismatic Evolutions ETB" required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Type"><Input name="product_type" defaultValue="sealed" /></Field>
                <Field label="Set"><Input name="set_name" placeholder="Prismatic Evolutions" /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="MSRP"><Input name="msrp" type="number" min="0" step="0.01" /></Field>
                <Field label="Packs"><Input name="pack_count" type="number" min="0" step="1" /></Field>
                <Field label="Release"><Input name="release_date" type="date" /></Field>
              </div>
              <Field label="Source URL"><Input name="source_url" type="url" /></Field>
              <Field label="Notes"><Textarea name="notes" /></Field>
              <Button disabled={isPending}><PackagePlus />Save product</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <CardTitle>Products</CardTitle>
            <div className="flex gap-2">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter products" className="w-48" />
              <Button variant="outline" onClick={() => downloadCsv("pokemon-products.csv", snapshot.products)}><Download />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>MSRP</TableHead><TableHead>Set</TableHead><TableHead>Type</TableHead><TableHead className="w-10"> </TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}><TableCell className="font-semibold">{product.name}</TableCell><TableCell>{formatMoney(product.msrp)}</TableCell><TableCell>{product.set_name ?? "-"}</TableCell><TableCell>{product.product_type}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => setEditState({ id: product.id, kind: "product", title: product.name, values: { msrp: product.msrp, name: product.name, notes: product.notes, pack_count: product.pack_count, product_type: product.product_type, set_name: product.set_name } })}>Edit</Button><Button variant="ghost" size="icon" aria-label={`Delete ${product.name}`} onClick={() => deleteRecord("product", product.id)}><Trash2 /></Button></div></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="collection" className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle>Add Collection Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-collection-item" />
              <Field label="Linked product"><ProductSelect products={snapshot.products} onChange={(product) => product && setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('input[name="item_name"]');
                if (input && !input.value) input.value = product.name;
              }, 0)} /></Field>
              <Field label="Item name"><Input name="item_name" required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Quantity"><Input name="quantity" type="number" min="1" defaultValue="1" /></Field>
                <Field label="Value each"><Input name="estimated_value" type="number" min="0" step="0.01" /></Field>
              </div>
              <Field label="Storage location"><Input name="storage_location" placeholder="Closet shelf, binder, grading pile" /></Field>
              <Field label="Notes"><Textarea name="notes" /></Field>
              <Button disabled={isPending}><Archive />Save item</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <CardTitle>Collection</CardTitle>
            <Button variant="outline" onClick={() => downloadCsv("pokemon-collection.csv", snapshot.collectionItems)}><Download />Export</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Value</TableHead><TableHead>Location</TableHead><TableHead className="w-10"> </TableHead></TableRow></TableHeader>
              <TableBody>
                {snapshot.collectionItems.map((item) => (
                  <TableRow key={item.id}><TableCell className="font-semibold">{item.item_name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{formatMoney((item.estimated_value ?? 0) * item.quantity)}</TableCell><TableCell>{item.storage_location ?? "-"}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => setEditState({ id: item.id, kind: "collection", title: item.item_name, values: { condition: item.condition, estimated_value: item.estimated_value, item_kind: item.item_kind, item_name: item.item_name, notes: item.notes, quantity: item.quantity, storage_location: item.storage_location } })}>Edit</Button><Button variant="ghost" size="icon" aria-label={`Delete ${item.item_name}`} onClick={() => deleteRecord("collection", item.id)}><Trash2 /></Button></div></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="purchase" className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>Purchase Calculator</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Product"><ProductSelect products={snapshot.products} onChange={(product) => {
              setSelectedCalcProduct(product);
              setCalc((current) => ({ ...current, itemPrice: product?.msrp ?? current.itemPrice }));
            }} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Item price"><Input type="number" min="0" step="0.01" value={calc.itemPrice} onChange={(event) => setCalc({ ...calc, itemPrice: Number(event.target.value) })} /></Field>
              <Field label="Quantity"><Input type="number" min="1" step="1" value={calc.quantity} onChange={(event) => setCalc({ ...calc, quantity: Number(event.target.value) })} /></Field>
              <Field label="Tax"><Input type="number" min="0" step="0.01" value={calc.tax} onChange={(event) => setCalc({ ...calc, tax: Number(event.target.value) })} /></Field>
              <Field label="Shipping"><Input type="number" min="0" step="0.01" value={calc.shipping} onChange={(event) => setCalc({ ...calc, shipping: Number(event.target.value) })} /></Field>
              <Field label="Resale estimate each"><Input type="number" min="0" step="0.01" value={calc.estimatedResalePrice} onChange={(event) => setCalc({ ...calc, estimatedResalePrice: Number(event.target.value) })} /></Field>
              <Field label="Fee %"><Input type="number" min="0" step="0.01" value={calc.feesPercent} onChange={(event) => setCalc({ ...calc, feesPercent: Number(event.target.value) })} /></Field>
            </div>
            <div className="rounded-md bg-mist p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p>Landed cost <strong className="block text-ink">{formatMoney(calculation.landedCost)}</strong></p>
                <p>Net proceeds <strong className="block text-ink">{formatMoney(calculation.netProceeds)}</strong></p>
                <p>Profit <strong className={cn("block", calculation.estimatedProfit >= 0 ? "text-emerald-700" : "text-red-700")}>{formatMoney(calculation.estimatedProfit)}</strong></p>
                <p>ROI <strong className={cn("block", calculation.roiPercent >= 0 ? "text-emerald-700" : "text-red-700")}>{formatPercent(calculation.roiPercent)}</strong></p>
              </div>
              <p className="mt-3 text-xs text-ink/55">Break-even resale price each: {formatMoney(calculation.breakEvenUnitPrice)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Save Purchase</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-purchase" />
              <Field label="Linked product"><ProductSelect products={snapshot.products} onChange={(product) => setSelectedCalcProduct(product)} /></Field>
              <Field label="Product name"><Input name="product_name" defaultValue={selectedCalcProduct?.name} required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Retailer"><Input name="retailer" /></Field>
                <Field label="Date"><Input name="purchase_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
                <Field label="Quantity"><Input name="quantity" type="number" min="1" defaultValue="1" /></Field>
                <Field label="Item price"><Input name="item_price" type="number" min="0" step="0.01" required /></Field>
                <Field label="Tax"><Input name="tax" type="number" min="0" step="0.01" defaultValue="0" /></Field>
                <Field label="Shipping"><Input name="shipping" type="number" min="0" step="0.01" defaultValue="0" /></Field>
              </div>
              <Field label="Purpose"><Input name="purpose" defaultValue="collecting" /></Field>
              <Field label="Notes"><Textarea name="notes" /></Field>
              <Button disabled={isPending}><ReceiptText />Save purchase</Button>
            </form>
            {snapshot.purchases.length ? (
              <div className="mt-5 space-y-2">
                {snapshot.purchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ink/10 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{purchase.product_name}</p>
                      <p className="text-sm text-ink/55">{purchase.retailer ?? "Purchase"} · {formatMoney(purchase.total_cost)}</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Delete purchase for ${purchase.product_name}`} onClick={() => deleteRecord("purchase", purchase.id)}><Trash2 /></Button>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="watch" className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Watchlist</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-watchlist-item" />
              <Field label="Name"><Input name="name" placeholder="Mega Evolution Booster Box" required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Target type"><Input name="target_type" defaultValue="sealed-product" /></Field>
                <Field label="Max price"><Input name="max_price" type="number" min="0" step="0.01" /></Field>
              </div>
              <Field label="Notes"><Textarea name="notes" /></Field>
              <Button disabled={isPending}><Plus />Add watch</Button>
            </form>
            <div className="mt-5 grid gap-2">
              {snapshot.watchlist.map((item) => (
                <div key={item.id} className="rounded-md border border-ink/10 p-3">
                  <div className="flex items-center justify-between gap-2"><p className="font-semibold">{item.name}</p><Badge variant="outline">{item.priority}</Badge></div>
                  <p className="mt-1 text-sm text-ink/55">Target: {item.max_price ? formatMoney(item.max_price) : "near MSRP"}</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditState({ id: item.id, kind: "watchlist", title: item.name, values: { enabled: item.enabled, max_price: item.max_price, name: item.name, notes: item.notes, priority: item.priority, target_type: item.target_type } })}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteRecord("watchlist", item.id)}><Trash2 />Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Manual Restock Observation</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-restock-observation" />
              <Field label="Linked product"><ProductSelect products={snapshot.products} /></Field>
              <Field label="Product name"><Input name="product_name" required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Retailer"><Input name="retailer" required /></Field>
                <Field label="Stock status"><Select name="stock_status" defaultValue="unknown"><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in-stock">In stock</SelectItem><SelectItem value="out-of-stock">Out of stock</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent></Select></Field>
                <Field label="Current price"><Input name="current_price" type="number" min="0" step="0.01" /></Field>
                <Field label="MSRP"><Input name="msrp" type="number" min="0" step="0.01" /></Field>
              </div>
              <Field label="Source URL"><Input name="source_url" type="url" /></Field>
              <Field label="Notes"><Textarea name="notes" /></Field>
              <Button disabled={isPending}><Search />Log observation</Button>
            </form>
            {snapshot.restockObservations.length ? (
              <div className="mt-5 space-y-2">
                {snapshot.restockObservations.slice(0, 5).map((observation) => (
                  <div key={observation.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ink/10 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{observation.product_name}</p>
                      <p className="text-sm text-ink/55">{observation.retailer} · {observation.stock_status.replaceAll("-", " ")}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditState({ id: observation.id, kind: "restock", title: observation.product_name, values: { confidence: observation.confidence, current_price: observation.current_price, msrp: observation.msrp, notes: observation.notes, product_name: observation.product_name, retailer: observation.retailer, stock_status: observation.stock_status } })}>Edit</Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete observation for ${observation.product_name}`} onClick={() => deleteRecord("restock", observation.id)}><Trash2 /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="jarvis" className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Jarvis Notes</CardTitle>
            <p className="text-sm text-ink/55">Send useful Pokemon Intelligence snapshots into Obsidian as draft notes.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={submit}>
              <input type="hidden" name="action" value="create-recap-note" />
              <div className="rounded-md border border-ink/10 bg-mist p-4">
                <p className="font-semibold text-ink">Pokemon Intelligence Recap</p>
                <p className="mt-1 text-sm text-ink/55">Creates a dated Jarvis note with portfolio value, signals, upcoming releases, watchlist gaps, and cleanup items.</p>
                <Button className="mt-3" disabled={isPending}><FilePlus2 />Create recap note</Button>
              </div>
            </form>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-decision-note" />
              <p className="font-semibold text-ink">Draft Purchase Decision</p>
              <Field label="Product"><Input name="product_name" required /></Field>
              <Field label="Retailer or source"><Input name="retailer" /></Field>
              <Field label="Listed price"><Input name="price" /></Field>
              <Field label="Why it looks good"><Textarea name="reason" /></Field>
              <Field label="Risks"><Textarea name="risks" /></Field>
              <Button disabled={isPending}><FilePlus2 />Create Jarvis draft</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Price Observations</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <input type="hidden" name="action" value="create-price-observation" />
              <Field label="Linked product"><ProductSelect products={snapshot.products} /></Field>
              <Field label="Product name"><Input name="product_name" required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Source"><Input name="source" placeholder="eBay, TCGplayer, local shop" required /></Field>
                <Field label="Price"><Input name="price" type="number" min="0" step="0.01" required /></Field>
              </div>
              <Field label="Source URL"><Input name="source_url" type="url" /></Field>
              <Button disabled={isPending}>Save price</Button>
            </form>
            {snapshot.priceObservations.length ? (
              <div className="mt-5 space-y-2">
                {snapshot.priceObservations.slice(0, 6).map((observation) => (
                  <div key={observation.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ink/10 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{observation.product_name}</p>
                      <p className="text-sm text-ink/55">{observation.source} · {formatMoney(observation.price + observation.shipping)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditState({ id: observation.id, kind: "price", title: observation.product_name, values: { confidence: observation.confidence, notes: observation.notes, price: observation.price, product_name: observation.product_name, shipping: observation.shipping, source: observation.source, source_url: observation.source_url } })}>Edit</Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete price for ${observation.product_name}`} onClick={() => deleteRecord("price", observation.id)}><Trash2 /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <Drawer open={Boolean(editState)} onOpenChange={(open) => !open && setEditState(null)} direction="right">
      <DrawerContent className="w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Edit {editState?.title}</DrawerTitle>
          <DrawerDescription>Update the record and save. This changes the Supabase row directly.</DrawerDescription>
        </DrawerHeader>
        {editState ? (
          <div className="grid gap-3 overflow-y-auto px-4 pb-4">
            {editableFields[editState.kind].map((field) => (
              <Field key={field.key} label={field.label}>
                {field.type === "textarea" ? (
                  <Textarea
                    value={String(editState.values[field.key] ?? "")}
                    onChange={(event) => setEditState({ ...editState, values: { ...editState.values, [field.key]: event.target.value } })}
                  />
                ) : field.type === "checkbox" ? (
                  <label className="flex h-10 items-center gap-2 rounded-md border border-ink/10 px-3 text-sm font-semibold">
                    <input
                      checked={Boolean(editState.values[field.key])}
                      type="checkbox"
                      onChange={(event) => setEditState({ ...editState, values: { ...editState.values, [field.key]: event.target.checked } })}
                    />
                    Enabled
                  </label>
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    step={field.type === "number" ? "0.01" : undefined}
                    value={String(editState.values[field.key] ?? "")}
                    onChange={(event) => setEditState({ ...editState, values: { ...editState.values, [field.key]: event.target.value } })}
                  />
                )}
              </Field>
            ))}
          </div>
        ) : null}
        <DrawerFooter>
          <Button onClick={saveEdit} disabled={isPending}>Save changes</Button>
          <Button variant="outline" onClick={() => setEditState(null)}>Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    </>
  );
}
