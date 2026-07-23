"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Heart,
  MapPinned,
  PackageSearch,
  Plus,
  Radio,
  RefreshCcw,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ConnectorStatus, RestockSnapshot, WatchlistItem } from "@/lib/restocks/types";
import { cn } from "@/lib/utils";

const watchlistStorageKey = "owens-hub:restock-watchlist:v1";
const starterWatchlist: WatchlistItem[] = [
  { id: "mega-evolution", name: "Mega Evolution", kind: "set", maxPricePercent: 100, enabled: true },
  { id: "prismatic-evolutions", name: "Prismatic Evolutions", kind: "set", maxPricePercent: 100, enabled: true },
  { id: "surging-sparks", name: "Surging Sparks", kind: "set", maxPricePercent: 105, enabled: true },
];

function money(value: number | null) {
  return value === null ? "Not listed" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function ConnectorRow({ connector }: { connector: ConnectorStatus }) {
  const ready = connector.health === "ready";
  return (
    <div className="grid gap-2 border-b border-ink/10 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{connector.name}</p>
          <Badge variant="outline">{connector.support.replaceAll("-", " ")}</Badge>
          <span className={cn("text-xs font-bold", ready ? "text-emerald-700" : connector.health === "error" ? "text-red-700" : "text-amber-700")}>
            {ready ? "Connected" : connector.health === "error" ? "Error" : "Setup needed"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-5 text-ink/55">{connector.detail}</p>
      </div>
      <p className="text-xs font-semibold text-ink/45">{connector.cadence}</p>
    </div>
  );
}

export function RestockHubClient({ initialSnapshot }: { initialSnapshot: RestockSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(starterWatchlist);
  const [newItem, setNewItem] = useState("");
  const watchlistLoaded = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(watchlistStorageKey);
    if (!saved) {
      watchlistLoaded.current = true;
      return;
    }
    let parsed = starterWatchlist;
    try {
      parsed = JSON.parse(saved) as WatchlistItem[];
    } catch {
      window.localStorage.removeItem(watchlistStorageKey);
    }
    const timer = window.setTimeout(() => {
      watchlistLoaded.current = true;
      setWatchlist(parsed);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!watchlistLoaded.current) return;
    window.localStorage.setItem(watchlistStorageKey, JSON.stringify(watchlist));
  }, [watchlist]);

  const liveEvents = useMemo(() => snapshot.events.filter((event) => event.stockStatus === "in-stock"), [snapshot.events]);
  const connectedCount = snapshot.connectors.filter((connector) => connector.health === "ready").length;

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/restocks", { cache: "no-store" });
      const payload = (await response.json()) as RestockSnapshot & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Refresh failed.");
      setSnapshot(payload);
      toast.success("Restock sources checked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  function addWatchItem() {
    const name = newItem.trim();
    if (!name) return;
    if (watchlist.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      toast.info("That item is already on your watchlist.");
      return;
    }
    setWatchlist((items) => [...items, { id: crypto.randomUUID(), name, kind: "sealed-product", maxPricePercent: 100, enabled: true }]);
    setNewItem("");
  }

  return (
    <Tabs defaultValue="live" className="flex flex-col gap-5">
      <div className="overflow-x-auto pb-1">
        <TabsList className="h-10 min-w-max" aria-label="Restock Hub sections">
          <TabsTrigger value="live"><Radio />Live</TabsTrigger>
          <TabsTrigger value="watchlist"><Heart />Watchlist</TabsTrigger>
          <TabsTrigger value="releases"><Clock3 />Releases</TabsTrigger>
          <TabsTrigger value="stores"><MapPinned />Stores</TabsTrigger>
          <TabsTrigger value="sources"><ShieldCheck />Sources</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="live" className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">AVAILABLE NOW</p>
            <p className="mt-2 text-2xl font-bold text-ink">{liveEvents.length}</p>
            <p className="mt-1 text-sm text-ink/50">Verified product signals</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">SOURCES READY</p>
            <p className="mt-2 text-2xl font-bold text-ink">{connectedCount}/{snapshot.connectors.length}</p>
            <p className="mt-1 text-sm text-ink/50">Official and community connectors</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold text-ink/45">WATCHING</p>
            <p className="mt-2 text-2xl font-bold text-ink">{watchlist.filter((item) => item.enabled).length}</p>
            <p className="mt-1 text-sm text-ink/50">Products and sets</p>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Live Restocks</h2>
            <p className="text-sm text-ink/50">Only verified connector results appear here.</p>
          </div>
          <Button onClick={refresh} disabled={refreshing} variant="outline">
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "Checking" : "Check now"}
          </Button>
        </div>

        {snapshot.events.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {snapshot.events.map((event) => {
              const available = event.stockStatus === "in-stock";
              const atMsrp = event.priceStatus === "msrp";
              return (
                <Card key={event.id} className={cn("border-l-4", available && atMsrp ? "border-l-emerald-500" : available ? "border-l-amber-500" : "border-l-red-400")}>
                  <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <div>
                      <p className="text-xs font-bold text-ink/45">{event.retailerName}</p>
                      <CardTitle className="mt-1">{event.productName}</CardTitle>
                    </div>
                    <Badge className={cn(available ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                      {available ? "In stock" : "Out of stock"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-ink/45">MSRP</p><p className="mt-1 font-bold">{money(event.msrp)}</p></div>
                      <div><p className="text-ink/45">Current</p><p className="mt-1 font-bold">{money(event.currentPrice)}</p></div>
                    </div>
                    <Button asChild disabled={!available}>
                      <Link href={event.productUrl} target="_blank" rel="noreferrer">Buy direct <ExternalLink /></Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Alert>
            <PackageSearch className="h-4 w-4" />
            <AlertTitle>No verified stock signals yet</AlertTitle>
            <AlertDescription>Connect Best Buy first, then add Pokémon Center and community alerts. Empty is safer than a false-positive purchase alert.</AlertDescription>
          </Alert>
        )}
      </TabsContent>

      <TabsContent value="watchlist" className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Personal Watchlist</h2>
          <p className="text-sm text-ink/50">Add any set or sealed product. Your list saves automatically on this device.</p>
        </div>
        <div className="flex max-w-xl gap-2">
          <Input value={newItem} onChange={(event) => setNewItem(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addWatchItem()} placeholder="Product or set name" aria-label="Product or set name" />
          <Button onClick={addWatchItem}><Plus />Add</Button>
        </div>
        <div className="overflow-hidden rounded-md border border-ink/10 bg-white">
          {watchlist.map((item) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-ink/10 px-4 py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-xs text-ink/45">Alert at {item.maxPricePercent}% of MSRP or less</p>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Remove ${item.name}`} onClick={() => setWatchlist((items) => items.filter((candidate) => candidate.id !== item.id))}>
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="releases" className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Upcoming Releases</h2>
          <p className="text-sm text-ink/50">Official dates will be normalized here with source links and countdowns.</p>
        </div>
        <Alert>
          <Clock3 className="h-4 w-4" />
          <AlertTitle>Release calendar connector is next</AlertTitle>
          <AlertDescription>We will import Pokémon’s official preorder information first, then use community calendars only as a secondary cross-check.</AlertDescription>
        </Alert>
      </TabsContent>

      <TabsContent value="stores" className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Preferred Stores</h2>
          <p className="text-sm text-ink/50">Save local retailers, notes, distance, and observed restock patterns.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-4 w-4" />Saved locations</CardTitle></CardHeader><CardContent><p className="text-sm text-ink/55">No preferred locations saved yet. Location search and Supabase sync are planned next.</p></CardContent></Card>
          <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed border-ink/20 bg-mist/60 p-6 text-center">
            <div><MapPinned className="mx-auto h-7 w-7 text-moss" /><p className="mt-3 font-semibold">Local inventory map</p><p className="mt-1 max-w-sm text-sm text-ink/50">Map provider and location permissions are intentionally not enabled until preferred stores are configured.</p></div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="sources" className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Source Health</h2>
          <p className="text-sm text-ink/50">How each signal is obtained, how often it checks, and whether setup is complete.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white px-4">
          {snapshot.connectors.map((connector) => <ConnectorRow connector={connector} key={connector.id} />)}
        </div>
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertTitle>Notification adapters are ready to add</AlertTitle>
          <AlertDescription>Discord webhook is the best first instant-alert channel. Browser push and email can follow after the stock signals are dependable.</AlertDescription>
        </Alert>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />No checkout bots, queue bypasses, or security circumvention.</div>
      </TabsContent>
    </Tabs>
  );
}
