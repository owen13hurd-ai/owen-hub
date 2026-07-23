import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { agentRegistry } from "@/lib/agents/registry";
import { addTaskToQueue, parseAgentTasks, sharedQueuePath } from "@/lib/agents/queue";
import { getObsidianStatus, hasObsidianConfig, readObsidianNote, writeObsidianNote } from "@/lib/obsidian/client";

const taskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  priority: z.enum(["critical", "high", "medium", "low"]),
  assignedAgent: z.enum(["project-manager", "research", "career", "dynasty", "pokemon", "daily-briefing", "documentation", "qa"]),
  project: z.string().trim().min(2).max(100),
  objective: z.string().trim().min(5).max(500),
  successCriteria: z.string().trim().min(5).max(500),
});

export async function GET() {
  if (!hasObsidianConfig()) {
    return NextResponse.json({ agents: agentRegistry, connected: false, tasks: [], error: "Obsidian is not configured." });
  }
  try {
    const [status, queue] = await Promise.all([getObsidianStatus(), readObsidianNote(sharedQueuePath)]);
    return NextResponse.json({
      agents: agentRegistry,
      connected: status.authenticated,
      tasks: parseAgentTasks(queue.content),
      runtime: { codex: "registered", hermes: "model-setup-needed" },
    });
  } catch (error) {
    return NextResponse.json({
      agents: agentRegistry,
      connected: false,
      tasks: [],
      error: error instanceof Error ? error.message : "Agent memory could not be reached.",
    });
  }
}

export async function POST(request: NextRequest) {
  if (!hasObsidianConfig()) return NextResponse.json({ error: "Obsidian is not configured." }, { status: 503 });
  const parsed = taskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Complete every task field before assigning it." }, { status: 400 });

  try {
    const queue = await readObsidianNote(sharedQueuePath);
    const next = addTaskToQueue(queue.content, parsed.data);
    await writeObsidianNote(sharedQueuePath, next.content);
    return NextResponse.json({ id: next.id, ok: true, tasks: parseAgentTasks(next.content) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Task could not be created." }, { status: 502 });
  }
}
