"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertCircle, CheckCircle2, CirclePause, Clock3, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { agentById } from "@/lib/agents/registry";
import type { AgentId, AgentTask, TaskStatus } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

type AgentVillageProps = {
  connected: boolean;
  loading: boolean;
  tasks: AgentTask[];
  onAssign: (agentId: AgentId) => void;
};

type VillageLocation = {
  id: AgentId;
  label: string;
  x: number;
  y: number;
  structure: string;
  unit: string;
};

const locations: VillageLocation[] = [
  { id: "project-manager", label: "Keep", x: 45, y: 8, structure: "02", unit: "02" },
  { id: "career", label: "Guild Hall", x: 8, y: 25, structure: "18", unit: "08" },
  { id: "research", label: "Archive", x: 76, y: 22, structure: "04", unit: "05" },
  { id: "dynasty", label: "Training Yard", x: 27, y: 51, structure: "07", unit: "14" },
  { id: "pokemon", label: "Field Lab", x: 58, y: 48, structure: "10", unit: "17" },
  { id: "daily-briefing", label: "Messenger Post", x: 84, y: 50, structure: "23", unit: "11" },
  { id: "documentation", label: "Scribe House", x: 10, y: 70, structure: "09", unit: "20" },
  { id: "qa", label: "South Gate", x: 68, y: 73, structure: "01", unit: "23" },
];

const statusPriority: Record<TaskStatus, number> = { blocked: 5, waiting: 4, claimed: 3, ready: 2, completed: 1 };

function agentStatus(tasks: AgentTask[], agentId: AgentId): TaskStatus | "idle" {
  return tasks
    .filter((task) => task.assignedAgent === agentId && task.status !== "completed")
    .sort((a, b) => statusPriority[b.status] - statusPriority[a.status])[0]?.status ?? "idle";
}

function statusLabel(status: TaskStatus | "idle") {
  return { ready: "Quest ready", claimed: "Working", waiting: "Waiting", blocked: "Blocked", completed: "Complete", idle: "Idle" }[status];
}

function statusStyle(status: TaskStatus | "idle") {
  if (status === "claimed") return "bg-emerald-700 text-white";
  if (status === "ready") return "bg-sky-700 text-white";
  if (status === "waiting") return "bg-amber-600 text-white";
  if (status === "blocked") return "bg-rose-700 text-white";
  return "bg-white/95 text-ink";
}

function StatusIcon({ status }: { status: TaskStatus | "idle" }) {
  if (status === "blocked") return <AlertCircle className="h-4 w-4" />;
  if (status === "waiting") return <Clock3 className="h-4 w-4" />;
  if (status === "claimed") return <CheckCircle2 className="h-4 w-4" />;
  return <CirclePause className="h-4 w-4" />;
}

export function AgentVillage({ connected, loading, tasks, onAssign }: AgentVillageProps) {
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);
  const reduceMotion = useReducedMotion();
  const selectedAgent = selectedId ? agentById.get(selectedId) : undefined;
  const selectedTasks = useMemo(
    () => tasks.filter((task) => task.assignedAgent === selectedId && task.status !== "completed"),
    [selectedId, tasks],
  );

  return (
    <div className="overflow-hidden rounded-md border border-ink/10 bg-white">
      <div className="flex flex-col gap-2 border-b border-ink/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Agent Village</h2>
          <p className="mt-1 text-sm text-ink/55">Each building is a specialist. Select one to inspect its real queue.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink/55">
          <span className={cn("h-2.5 w-2.5 rounded-full", connected ? "bg-emerald-600" : "bg-rose-600")} aria-hidden="true" />
          {connected ? "Memory connected" : "Memory offline"}
        </div>
      </div>

      <div className="overflow-x-auto bg-[#b9d99b] p-3 sm:p-5">
        <div className="relative mx-auto aspect-[16/9] min-w-[860px] max-w-[1180px] overflow-hidden rounded-md border-2 border-[#315744] bg-[#8fc477] shadow-[0_14px_30px_rgba(49,87,68,0.18)]">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(45deg,#7eb568_25%,transparent_25%),linear-gradient(-45deg,#7eb568_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#7eb568_75%),linear-gradient(-45deg,transparent_75%,#7eb568_75%)] [background-position:0_0,0_8px,8px_-8px,-8px_0] [background-size:16px_16px]" />
          <div className="absolute left-[48%] top-0 h-full w-[7%] bg-[#d7bd77] opacity-80" />
          <div className="absolute left-0 top-[57%] h-[8%] w-full bg-[#d7bd77] opacity-80" />
          <div className="absolute bottom-[4%] left-[43%] h-[22%] w-[18%] rounded-[50%] bg-[#6ea8a2] ring-4 ring-[#d7bd77]" />

          {["01", "03", "05", "06", "08", "11", "12"].map((tree, index) => (
            <Image
              key={tree}
              src={`/assets/agent-village/environment/medievalEnvironment_${tree}.png`}
              alt=""
              width={64}
              height={64}
              className="pointer-events-none absolute h-[8%] w-auto [image-rendering:pixelated]"
              style={{ left: `${[2, 18, 34, 62, 92, 3, 91][index]}%`, top: `${[4, 8, 81, 5, 8, 48, 81][index]}%` }}
            />
          ))}

          {locations.map((location) => {
            const agent = agentById.get(location.id)!;
            const status = agentStatus(tasks, location.id);
            const openTasks = tasks.filter((task) => task.assignedAgent === location.id && task.status !== "completed").length;
            return (
              <button
                key={location.id}
                type="button"
                className="group absolute w-[13%] min-w-[104px] -translate-x-1/2 text-left outline-none focus-visible:ring-4 focus-visible:ring-white/80"
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
                onClick={() => setSelectedId(location.id)}
                aria-label={`Open ${agent.name} agent at ${location.label}`}
              >
                <span className="absolute left-1/2 top-0 z-[1] -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-sm bg-[#17372f]/90 px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                  {location.label}
                </span>
                <Image
                  src={`/assets/agent-village/structures/medievalStructure_${location.structure}.png`}
                  alt=""
                  width={128}
                  height={128}
                  className="h-auto w-full transition-transform duration-200 [image-rendering:pixelated] group-hover:-translate-y-1 group-focus-visible:-translate-y-1"
                />
                <motion.span
                  className="absolute bottom-[-4%] left-1/2 z-[2] block h-[40%] w-[40%] -translate-x-1/2"
                  animate={!reduceMotion && status === "claimed" ? { y: [0, -4, 0] } : undefined}
                  transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image src={`/assets/agent-village/units/medievalUnit_${location.unit}.png`} alt="" fill sizes="64px" className="object-contain [image-rendering:pixelated]" />
                </motion.span>
                <span className={cn("absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-sm px-2 py-1 text-[10px] font-bold shadow-sm", statusStyle(status))}>
                  <StatusIcon status={status} /> {loading ? "Checking" : statusLabel(status)}{openTasks ? ` · ${openTasks}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-ink/10 px-4 py-3 text-xs text-ink/55 sm:px-5">
        {(["claimed", "ready", "waiting", "blocked", "idle"] as const).map((status) => (
          <span key={status} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", status === "claimed" ? "bg-emerald-700" : status === "ready" ? "bg-sky-700" : status === "waiting" ? "bg-amber-600" : status === "blocked" ? "bg-rose-700" : "bg-ink/25")} />{statusLabel(status)}</span>
        ))}
      </div>

      <Drawer open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <div className="flex items-center gap-3">
                {selectedId ? <Image src={`/assets/agent-village/units/medievalUnit_${locations.find((item) => item.id === selectedId)?.unit}.png`} alt="" width={56} height={56} className="[image-rendering:pixelated]" /> : null}
                <div><DrawerTitle>{selectedAgent?.name} Agent</DrawerTitle><DrawerDescription>{selectedAgent?.mission}</DrawerDescription></div>
              </div>
            </DrawerHeader>
            <div className="grid gap-4 px-4 pb-2">
              <div>
                <p className="text-sm font-semibold text-ink">Current work</p>
                {selectedTasks.length ? (
                  <div className="mt-2 grid gap-2">
                    {selectedTasks.map((task) => <div key={task.id} className="rounded-md border border-ink/10 p-3"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink">{task.title}</p><Badge variant="outline">{statusLabel(task.status)}</Badge></div><p className="mt-1 text-sm text-ink/55">{task.project} · {task.priority} priority</p></div>)}
                  </div>
                ) : <p className="mt-2 text-sm text-ink/55">No open tasks. This agent is available.</p>}
              </div>
              <div><p className="text-sm font-semibold text-ink">Specialist modes</p><div className="mt-2 flex flex-wrap gap-1.5">{selectedAgent?.modes.map((mode) => <Badge key={mode} variant="secondary">{mode}</Badge>)}</div></div>
            </div>
            <DrawerFooter className="sm:flex-row sm:justify-end">
              <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
              {selectedId ? <Button disabled={!connected} onClick={() => { onAssign(selectedId); setSelectedId(null); }}><Plus />Assign task</Button> : null}
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
