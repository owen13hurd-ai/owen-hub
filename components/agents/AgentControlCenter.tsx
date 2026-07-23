"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bot,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  FileText,
  FolderKanban,
  Newspaper,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v3";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentVillage } from "@/components/agents/AgentVillage";
import { agentCategories, agentRegistry } from "@/lib/agents/registry";
import type { AgentId, AgentTask } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().trim().min(3, "Add a short task title.").max(120),
  assignedAgent: z.enum(["project-manager", "research", "career", "dynasty", "pokemon", "daily-briefing", "documentation", "qa"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  project: z.string().trim().min(2, "Choose the related project.").max(100),
  objective: z.string().trim().min(5, "Explain what the agent should accomplish.").max(500),
  successCriteria: z.string().trim().min(5, "Describe what complete looks like.").max(500),
});

type TaskForm = z.infer<typeof taskSchema>;
type AgentResponse = {
  connected: boolean;
  tasks: AgentTask[];
  error?: string;
  runtime?: { codex: string; hermes: string };
};

const agentIcons = {
  "project-manager": FolderKanban,
  research: Search,
  career: BriefcaseBusiness,
  dynasty: Shield,
  pokemon: Sparkles,
  "daily-briefing": Newspaper,
  documentation: FileText,
  qa: FileCheck2,
} as const;

const projects = ["Owens Hub Project", "Career Hub Project", "Dynasty Hub Project", "Pokemon Hub Project", "Pokemon Restock Hub Project", "Poker Hub Project", "Travel Hub Project", "Second Brain Project"];

function accentClass(accent: (typeof agentRegistry)[number]["accent"]) {
  if (accent === "moss") return "bg-emerald-50 text-emerald-800";
  if (accent === "ember") return "bg-amber-50 text-amber-900";
  if (accent === "sky") return "bg-sky-50 text-sky-800";
  return "bg-mist text-ink";
}

function permissionLabel(permission: (typeof agentRegistry)[number]["permissions"][number]) {
  return {
    read: "Read",
    draft: "Draft",
    "write-memory": "Write memory",
    queue: "Manage queue",
    "external-approval": "Approval for external actions",
  }[permission];
}

export function AgentControlCenter() {
  const [connected, setConnected] = useState(false);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      assignedAgent: "project-manager",
      priority: "medium",
      project: "Owens Hub Project",
      objective: "",
      successCriteria: "",
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/agents", { cache: "no-store" });
      const payload = await response.json() as AgentResponse;
      setConnected(payload.connected);
      setTasks(payload.tasks);
      if (payload.error) setError(payload.error);
    } catch {
      setError("The shared agent queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openAssignment(agentId: AgentId = "project-manager") {
    form.reset({
      title: "",
      assignedAgent: agentId,
      priority: "medium",
      project: agentId === "career" ? "Career Hub Project" : agentId === "dynasty" ? "Dynasty Hub Project" : agentId === "pokemon" ? "Pokemon Hub Project" : "Owens Hub Project",
      objective: "",
      successCriteria: "",
    });
    setDialogOpen(true);
  }

  async function createTask(values: TaskForm) {
    setSaving(true);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json() as { error?: string; id?: string; tasks?: AgentTask[] };
      if (!response.ok) throw new Error(payload.error ?? "Task could not be assigned.");
      setTasks(payload.tasks ?? []);
      setDialogOpen(false);
      toast.success(`${payload.id} added to the shared queue`);
    } catch (submissionError) {
      toast.error(submissionError instanceof Error ? submissionError.message : "Task could not be assigned.");
    } finally {
      setSaving(false);
    }
  }

  const readyTasks = tasks.filter((task) => task.status === "ready");
  const activeTasks = tasks.filter((task) => task.status === "claimed").length;
  const waitingTasks = tasks.filter((task) => task.status === "waiting" || task.status === "blocked").length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="village" className="!flex-col space-y-5">
        <TabsList aria-label="Agent workspace view" className="h-9 self-start rounded-md border border-ink/10 bg-white p-1">
          <TabsTrigger value="village" className="rounded-sm px-3 data-[state=active]:bg-ink data-[state=active]:text-white">Village</TabsTrigger>
          <TabsTrigger value="control" className="rounded-sm px-3 data-[state=active]:bg-ink data-[state=active]:text-white">Control</TabsTrigger>
        </TabsList>
        <TabsContent value="village">
          <AgentVillage connected={connected} loading={loading} tasks={tasks} onAssign={openAssignment} />
        </TabsContent>
        <TabsContent value="control" className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-ink/10 bg-white p-4">
          <p className="text-xs font-bold text-ink/40">MEMORY</p>
          <div className="mt-2 flex items-center gap-2"><Brain className="h-5 w-5 text-moss" /><p className="text-lg font-bold">{connected ? "Connected" : "Offline"}</p></div>
          <p className="mt-1 text-sm text-ink/50">Obsidian shared memory</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white p-4">
          <p className="text-xs font-bold text-ink/40">AGENTS</p>
          <p className="mt-2 text-2xl font-bold">{agentRegistry.length}</p>
          <p className="mt-1 text-sm text-ink/50">Core roles defined</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white p-4">
          <p className="text-xs font-bold text-ink/40">QUEUE</p>
          <p className="mt-2 text-2xl font-bold">{readyTasks.length}</p>
          <p className="mt-1 text-sm text-ink/50">Ready for assignment</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white p-4">
          <p className="text-xs font-bold text-ink/40">ATTENTION</p>
          <p className="mt-2 text-2xl font-bold">{activeTasks + waitingTasks}</p>
          <p className="mt-1 text-sm text-ink/50">Working, waiting, or blocked</p>
        </div>
      </section>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Memory connected; execution is manually triggered</AlertTitle>
        <AlertDescription>Codex and Hermes share this queue. Hermes still needs `hermes setup model` before independent runs; scheduled execution will be added only after the manual workflow is reliable.</AlertDescription>
      </Alert>

      {error ? <Alert variant="destructive"><AlertTitle>Agent memory unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}

      <section className="overflow-hidden rounded-md border border-ink/10 bg-white">
        <div className="flex flex-col gap-3 border-b border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h2 className="text-lg font-bold text-ink">Shared Task Queue</h2><p className="mt-1 text-sm text-ink/50">Structured work written directly to Obsidian.</p></div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />Refresh</Button><Button onClick={() => openAssignment()} disabled={!connected}><Plus />Assign task</Button></div>
        </div>
        {loading ? <div className="space-y-3 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : readyTasks.length ? (
          <div className="divide-y divide-ink/10">
            {readyTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink">{task.title}</p><Badge variant="outline">{task.priority}</Badge></div><p className="mt-1 text-sm text-ink/50">{task.id} · {agentRegistry.find((agent) => agent.id === task.assignedAgent)?.name ?? "Unassigned"} · {task.project}</p></div>
                <Badge className="bg-emerald-50 text-emerald-800">Ready</Badge>
              </div>
            ))}
          </div>
        ) : <div className="px-5 py-8 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-700" /><p className="mt-2 font-semibold">No queued work</p><p className="mt-1 text-sm text-ink/50">Assign a focused task when you want an agent to take ownership.</p></div>}
      </section>

      {agentCategories.map((category) => (
        <section key={category.id}>
          <div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-bold text-ink">{category.label}</h2><p className="text-sm text-ink/50">{category.id === "orchestration" ? "Routes work without replacing specialist judgment." : category.id === "domain" ? "Uses your personal data and domain-specific rules." : "Shared evidence, briefing, memory, and verification."}</p></div></div>
          <div className="grid gap-3 lg:grid-cols-2">
            {agentRegistry.filter((agent) => agent.category === category.id).map((agent) => {
              const Icon = agentIcons[agent.id];
              return (
                <article key={agent.id} className="rounded-md border border-ink/10 bg-white p-4 shadow-[0_8px_24px_rgba(23,33,31,0.035)] sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3"><div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", accentClass(agent.accent))}><Icon className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-ink">{agent.name}</h3><Badge variant="outline">{agent.trigger === "scheduled-ready" ? "Schedule-ready" : "Manual"}</Badge></div><p className="mt-1 text-sm leading-5 text-ink/55">{agent.mission}</p></div></div>
                    <Button size="sm" variant="outline" onClick={() => openAssignment(agent.id)} disabled={!connected}><Plus />Task</Button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div><p className="text-xs font-bold text-ink/40">SPECIALIST MODES</p><div className="mt-2 flex flex-wrap gap-1.5">{agent.modes.map((mode) => <Badge key={mode} variant="secondary">{mode}</Badge>)}</div></div>
                    <div><p className="text-xs font-bold text-ink/40">PERMISSIONS</p><div className="mt-2 flex flex-wrap gap-1.5">{agent.permissions.map((permission) => <Badge key={permission} variant="outline">{permissionLabel(permission)}</Badge>)}</div></div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Assign Agent Task</DialogTitle><DialogDescription>This creates a permanent, structured task in the shared Obsidian queue.</DialogDescription></DialogHeader>
          <Form {...form}>
            <form id="agent-task-form" className="grid gap-4" onSubmit={form.handleSubmit(createTask)}>
              <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Task title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="assignedAgent" render={({ field }) => <FormItem><FormLabel>Agent</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent>{agentRegistry.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                <FormField control={form.control} name="priority" render={({ field }) => <FormItem><FormLabel>Priority</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent>{["critical", "high", "medium", "low"].map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
              </div>
              <FormField control={form.control} name="project" render={({ field }) => <FormItem><FormLabel>Project memory</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent>{projects.map((project) => <SelectItem key={project} value={project}>{project}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
              <FormField control={form.control} name="objective" render={({ field }) => <FormItem><FormLabel>Objective</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="successCriteria" render={({ field }) => <FormItem><FormLabel>What does complete look like?</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>} />
            </form>
          </Form>
          <DialogFooter><Button type="submit" form="agent-task-form" disabled={saving}>{saving ? "Assigning" : "Add to queue"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
